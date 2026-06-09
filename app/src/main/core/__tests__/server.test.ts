import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { WebSocket } from 'ws'
import { bus } from '../transport'
import { startServer, type RunningServer } from '../server'

/**
 * Group 0 smoke: the hybrid-runtime transport answers a `helm` HTTP call and
 * relays a server→client push over WebSocket. This is the contract every bridge
 * rides; the full bridge behavior is covered by the IPC suites.
 */

let server: RunningServer
beforeEach(() => {
  bus.reset()
})
afterEach(async () => {
  await server.close()
})

describe('helm HTTP/WS transport', () => {
  it('answers a registered helm channel over POST /helm/<channel>', async () => {
    bus.handle('demo:echo', (_e, raw) => ({ ok: true, got: raw }))
    server = await startServer({ port: 0 })
    const res = await fetch(`http://127.0.0.1:${server.port}/helm/demo:echo`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, got: { hello: 'world' } })
  })

  it('returns 404 for an unknown channel', async () => {
    server = await startServer({ port: 0 })
    const res = await fetch(`http://127.0.0.1:${server.port}/helm/nope:missing`, { method: 'POST' })
    expect(res.status).toBe(404)
    expect(await res.json()).toMatchObject({ error: 'unknown_channel' })
  })

  it('preview proxy injects the capture/edit bridge into top-level HTML and passes assets through', async () => {
    // A stand-in "dev server" the proxy forwards to.
    const upstream: Server = createServer((req, res) => {
      if (req.url?.startsWith('/app.js')) {
        res.writeHead(200, { 'content-type': 'text/javascript' })
        res.end('console.log("app")')
        return
      }
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end('<html><head><title>App</title></head><body>Hi</body></html>')
    })
    await new Promise<void>((r) => upstream.listen(0, '127.0.0.1', r))
    const upAddr = upstream.address()
    const upPort = typeof upAddr === 'object' && upAddr ? upAddr.port : 0

    server = await startServer({
      port: 0,
      previewOrigin: (id) => (id === 'p1' ? `http://127.0.0.1:${upPort}` : null),
    })

    const html = await fetch(`http://127.0.0.1:${server.port}/preview/p1/`)
    expect(html.headers.get('content-type')).toContain('text/html')
    const body = await html.text()
    expect(body).toContain('__helmInstallTextEdit')
    expect(body).toContain('__helmInstallPoint')
    // FIX 5: a <base href> so the app's root-relative URLs resolve under the proxy.
    expect(body).toContain('<base href="/preview/p1/">')
    // FIX 1: the point-capture relay forwards the click geometry+selector to the parent.
    expect(body).toContain('helm:point-capture')
    expect(body).toContain('Hi') // original content preserved

    const js = await fetch(`http://127.0.0.1:${server.port}/preview/p1/app.js`)
    expect(js.headers.get('content-type')).toContain('text/javascript')
    expect(await js.text()).toBe('console.log("app")') // asset passed through untouched

    const notLive = await fetch(`http://127.0.0.1:${server.port}/preview/unknown/`)
    expect(notLive.status).toBe(503)

    await new Promise<void>((r) => upstream.close(() => r()))
  })

  it('relays a bus broadcast to a connected WebSocket client', async () => {
    server = await startServer({ port: 0 })
    const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`)
    const frame = await new Promise<{ channel: string; payload: unknown }>((resolve, reject) => {
      ws.on('open', () => bus.broadcast('shelf:updated', { projectId: 'p1', items: [] }))
      ws.on('message', (data) => resolve(JSON.parse(String(data))))
      ws.on('error', reject)
    })
    ws.close()
    expect(frame).toEqual({ channel: 'shelf:updated', payload: { projectId: 'p1', items: [] } })
  })
})
