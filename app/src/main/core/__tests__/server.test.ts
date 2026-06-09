import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
