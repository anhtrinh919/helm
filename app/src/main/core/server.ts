import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { WebSocketServer, type WebSocket } from 'ws'
import { bus, UnknownChannelError, type PushClient } from './transport'
import {
  INSTALL_SCRIPT,
  REMOVE_SCRIPT,
  TEXT_EDIT_INSTALL_SCRIPT,
  TEXT_EDIT_REMOVE_SCRIPT,
} from '../sdk/point-capture-service'

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
  /**
   * Preview proxy resolver (Group 5). Given a project id, returns its live
   * dev-server origin (e.g. `http://localhost:5173`) or null when the preview is
   * not live. `GET /preview/<projectId>/*` is reverse-proxied to that origin so
   * the user's running app is served same-origin with the Helm UI — which lets
   * the click-capture + inline-edit scripts run in a plain browser (the same
   * affordance Electron's <webview> gets for free). Omit to disable proxying.
   */
  previewOrigin?: (projectId: string) => string | null
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

/**
 * The capture/edit scripts, exposed to the proxied page as togglable globals so
 * the same-origin Helm UI can drive point-mode + inline-edit in a plain browser
 * exactly as the Electron <webview> path does. Reporting still flows over the
 * existing `__HELM_POINT__` / `__HELM_TEXTEDIT__` console channel; the same-origin
 * parent reads it and forwards to the core via the existing `points.*` helm calls.
 */
/**
 * The relay patch wraps __helmInstallTextEdit so that after the in-page commit
 * script fires (console.log __HELM_TEXTEDIT__), it ALSO sends a postMessage to
 * the parent frame. The parent (PointAnnotations) is same-origin in the browser
 * proxy path, so it can listen for this message and call registerTextEdit with
 * the selector/oldText/newText — the browser path's equivalent of the Electron
 * webview-console interception in PointCaptureService.
 */
const TEXT_EDIT_RELAY_PATCH = `
  var _origInstall = window.__helmInstallTextEdit;
  window.__helmInstallTextEdit = function(){
    _origInstall();
    var S = window.__helmTextEdit;
    if(!S) return;
    var _origCommit = S.commit.bind(S);
    S.commit = function(){
      var el = S.editing;
      var selector = S.selector || '';
      var oldText = S.original || '';
      var newText = (el && el.textContent ? el.textContent.trim() : '');
      _origCommit();
      try { window.parent.postMessage({type:'helm:text-edit-commit',selector:selector,oldText:oldText,newText:newText},'*'); } catch(e){}
    };
  };
`

const HELM_PREVIEW_BRIDGE = `<script>(function(){
  if (window.__helmPreviewBridge) return;
  window.__helmPreviewBridge = true;
  window.__helmInstallPoint = function(){ ${INSTALL_SCRIPT} };
  window.__helmRemovePoint = function(){ ${REMOVE_SCRIPT} };
  window.__helmInstallTextEdit = function(){ ${TEXT_EDIT_INSTALL_SCRIPT} };
  window.__helmRemoveTextEdit = function(){ ${TEXT_EDIT_REMOVE_SCRIPT} };
  ${TEXT_EDIT_RELAY_PATCH}
})();</script>`

function injectBridge(html: string): string {
  // Inject right after <head> so the helpers exist before app scripts; fall back
  // to prepending if there is no <head> (fragment / unusual document).
  const headOpen = html.match(/<head[^>]*>/i)
  if (headOpen && headOpen.index != null) {
    const at = headOpen.index + headOpen[0].length
    return html.slice(0, at) + HELM_PREVIEW_BRIDGE + html.slice(at)
  }
  return HELM_PREVIEW_BRIDGE + html
}

/**
 * Reverse-proxy `GET /preview/<projectId>/<rest>` to the project's live dev
 * server, injecting the capture/edit bridge into the TOP-LEVEL HTML document.
 * Sub-resources (JS/CSS/assets/XHR) are passed through verbatim. The dev server
 * is on 127.0.0.1; nothing here widens the bind.
 *
 * Limitation (documented, not faked): only the top-level HTML document is
 * rewritten to carry the bridge. Same-origin sub-documents/iframes inside the
 * app are proxied but not separately rewritten — the common SPA case (one root
 * document) is fully covered; deeply nested cross-document apps would need
 * per-frame injection, which is out of scope for this group.
 */
async function handlePreview(
  req: IncomingMessage,
  res: ServerResponse,
  rest: string,
  resolveOrigin: (projectId: string) => string | null,
): Promise<void> {
  const slash = rest.indexOf('/')
  const projectId = slash === -1 ? rest : rest.slice(0, slash)
  const subPath = slash === -1 ? '/' : rest.slice(slash)
  if (!projectId) {
    sendJson(res, 404, { error: 'unknown_preview' })
    return
  }
  const origin = resolveOrigin(projectId)
  if (!origin) {
    sendJson(res, 503, { error: 'preview_not_live' })
    return
  }
  const query = (req.url ?? '').includes('?') ? '?' + (req.url ?? '').split('?').slice(1).join('?') : ''
  const target = origin.replace(/\/$/, '') + subPath + query

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method: req.method ?? 'GET',
      headers: { accept: req.headers.accept ?? '*/*' },
      redirect: 'manual',
    })
  } catch {
    sendJson(res, 502, { error: 'preview_unreachable' })
    return
  }

  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const isHtml = contentType.includes('text/html')
  if (isHtml) {
    const html = await upstream.text()
    const body = injectBridge(html)
    res.writeHead(upstream.status, { 'content-type': 'text/html; charset=utf-8' })
    res.end(body)
    return
  }
  // Pass-through for everything else (JS/CSS/assets), preserving content-type.
  const buf = Buffer.from(await upstream.arrayBuffer())
  res.writeHead(upstream.status, { 'content-type': contentType })
  res.end(buf)
}

export async function startServer(opts: ServerOptions = {}): Promise<RunningServer> {
  const httpServer: Server = createServer((req, res) => {
    const url = req.url ?? '/'
    const path = url.split('?')[0] ?? '/'
    if (path.startsWith('/helm/')) {
      void handleHelm(req, res, path.slice('/helm/'.length))
      return
    }
    if (path.startsWith('/preview/') && opts.previewOrigin) {
      void handlePreview(req, res, path.slice('/preview/'.length), opts.previewOrigin)
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
