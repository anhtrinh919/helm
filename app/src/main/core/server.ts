import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { WebSocketServer, type WebSocket } from 'ws'
import { bus, UnknownChannelError, type PushClient } from './transport'

/**
 * The local `helm` HTTP + WebSocket server (Phase 1, Group 0).
 *
 *   - `POST /helm/<channel>` with a JSON body → the bridge handler's response,
 *     as JSON. Unknown channel → 404. Handler throw → 500 `{ error }`.
 *   - `GET /ws` (WebSocket) → every server→client push (`shelf:updated`,
 *     `point:captured`, feed events, …) arrives as a JSON `{ channel, payload }`
 *     frame. The renderer's bridge client subscribes here.
 *   - In production an optional `staticDir` serves the built renderer so the
 *     core can host the whole app; in dev Vite serves the UI and proxies
 *     `/helm` + `/ws` here.
 *
 * Bound to 127.0.0.1 only — never network-exposed.
 */

export interface ServerOptions {
  /** Preferred port; 0 (default) picks an ephemeral free port. */
  port?: number
  /** Built-renderer directory to serve in production. Omit in dev (Vite serves). */
  staticDir?: string
}

export interface RunningServer {
  port: number
  close(): Promise<void>
}

const HOST = '127.0.0.1'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body)
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(json)
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  const text = Buffer.concat(chunks).toString('utf-8')
  if (!text.trim()) return {}
  return JSON.parse(text) as unknown
}

async function handleHelm(req: IncomingMessage, res: ServerResponse, channel: string): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method_not_allowed' })
    return
  }
  if (!bus.has(channel)) {
    sendJson(res, 404, { error: 'unknown_channel', channel })
    return
  }
  let payload: unknown
  try {
    payload = await readBody(req)
  } catch {
    sendJson(res, 400, { error: 'invalid_json' })
    return
  }
  try {
    const result = await bus.invoke(channel, payload)
    sendJson(res, 200, result)
  } catch (e) {
    if (e instanceof UnknownChannelError) {
      sendJson(res, 404, { error: 'unknown_channel', channel })
      return
    }
    // Bridge handlers map their own errors into `{ error }` Result shapes and do
    // not throw; an actual throw here is an unexpected core fault.
    sendJson(res, 500, { error: 'core_error', message: e instanceof Error ? e.message : 'unknown' })
  }
}

async function serveStatic(res: ServerResponse, staticDir: string, urlPath: string): Promise<void> {
  // Resolve under staticDir and refuse to escape it (no path traversal).
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  let filePath = join(staticDir, rel)
  if (!filePath.startsWith(staticDir)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  try {
    let data = await readFile(filePath).catch(() => null)
    if (!data || urlPath === '/' || extname(filePath) === '') {
      // SPA fallback: unknown route → index.html.
      filePath = join(staticDir, 'index.html')
      data = await readFile(filePath)
    }
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}

export async function startServer(opts: ServerOptions = {}): Promise<RunningServer> {
  const httpServer: Server = createServer((req, res) => {
    const url = req.url ?? '/'
    const path = url.split('?')[0] ?? '/'
    if (path.startsWith('/helm/')) {
      void handleHelm(req, res, path.slice('/helm/'.length))
      return
    }
    if (opts.staticDir) {
      void serveStatic(res, opts.staticDir, path)
      return
    }
    res.writeHead(404)
    res.end('Not found')
  })

  // WebSocket push channel. One client per socket; relays bus broadcasts.
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })
  wss.on('connection', (socket: WebSocket) => {
    const client: PushClient = {
      send: (channel, payload) => {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ channel, payload }))
      },
    }
    bus.addClient(client)
    socket.on('close', () => bus.removeClient(client))
    socket.on('error', () => bus.removeClient(client))
  })

  await new Promise<void>((resolve) => httpServer.listen(opts.port ?? 0, HOST, resolve))
  const addr = httpServer.address()
  const port = typeof addr === 'object' && addr ? addr.port : (opts.port ?? 0)

  return {
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        wss.close()
        httpServer.close((err) => (err ? reject(err) : resolve()))
      }),
  }
}
