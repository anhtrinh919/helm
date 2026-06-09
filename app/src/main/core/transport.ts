/**
 * Hybrid-runtime transport seam (Phase 1, Group 0).
 *
 * The core logic (DB, orchestrators, bridge handlers) used to be wired straight
 * to Electron: handlers via `ipcMain.handle`, server→client pushes via
 * `BrowserWindow.webContents.send`. The hybrid runtime moves that transport to a
 * local HTTP + WebSocket server (see ./server.ts) bound to 127.0.0.1, so the same
 * UI can run in a plain browser at localhost or inside the Electron shell.
 *
 * This module is the single seam that makes that swap invisible to the bridges:
 *   - `ipcMain` here is an `ipcMain`-shaped registration sink backed by `bus`.
 *     Bridges keep calling `ipcMain.handle(channel, (_e, raw) => …)` unchanged;
 *     the call is recorded on the bus and invoked by the HTTP layer.
 *   - `bus.window()` returns a synthetic `HelmWindow` whose `webContents.send`
 *     fans the push out to every connected WebSocket client. Bridges keep calling
 *     `getWindow().webContents.send(channel, payload)` unchanged.
 *
 * There is exactly one push path (bus → WS clients) whether the UI is a browser
 * tab or the Electron BrowserWindow (which is just Chromium pointed at localhost).
 */

export type IpcHandler = (event: unknown, raw: unknown) => unknown | Promise<unknown>

/** The minimal slice of Electron's BrowserWindow the bridges actually use for pushes. */
export interface HelmWindow {
  isDestroyed(): boolean
  webContents: { send(channel: string, payload: unknown): void }
}

/** A connected push client (one per WebSocket). */
export interface PushClient {
  send(channel: string, payload: unknown): void
}

class HelmBus {
  private handlers = new Map<string, IpcHandler>()
  private clients = new Set<PushClient>()
  private syntheticWindow: HelmWindow

  constructor() {
    this.syntheticWindow = {
      isDestroyed: () => false,
      webContents: { send: (channel, payload) => this.broadcast(channel, payload) },
    }
  }

  /** Register a request/response handler for a `helm` channel (last registration wins). */
  handle(channel: string, fn: IpcHandler): void {
    this.handlers.set(channel, fn)
  }

  /** True if a handler exists for the channel (used by the HTTP layer for 404s). */
  has(channel: string): boolean {
    return this.handlers.has(channel)
  }

  /** Invoke a registered handler. Throws if the channel is unknown. */
  async invoke(channel: string, payload: unknown): Promise<unknown> {
    const fn = this.handlers.get(channel)
    if (!fn) throw new UnknownChannelError(channel)
    return await fn(undefined, payload)
  }

  /** Fan a server→client push out to every connected client. */
  broadcast(channel: string, payload: unknown): void {
    for (const client of this.clients) {
      try {
        client.send(channel, payload)
      } catch {
        // A dead socket shouldn't break the others; the server drops it on close.
      }
    }
  }

  addClient(client: PushClient): void {
    this.clients.add(client)
  }

  removeClient(client: PushClient): void {
    this.clients.delete(client)
  }

  /** The synthetic window handed to bridges/orchestrators in place of BrowserWindow. */
  window(): HelmWindow {
    return this.syntheticWindow
  }

  /** Test helper: forget all handlers and clients between cases. */
  reset(): void {
    this.handlers.clear()
    this.clients.clear()
  }
}

export class UnknownChannelError extends Error {
  constructor(public channel: string) {
    super(`No handler registered for helm channel: ${channel}`)
    this.name = 'UnknownChannelError'
  }
}

/**
 * The one bus per process. The HTTP/WS server and every bridge share it.
 *
 * SINGLE-CORE-PER-PROCESS INVARIANT: `bus` is a module-level singleton, so all
 * handler registrations and push clients are global to the process. Booting two
 * cores in the same process would have them register handlers on the same bus
 * and fan pushes to each other's WebSocket clients — silent cross-talk. The
 * runtime only ever starts one core per process (Electron shell or the headless
 * dogfood), and `startCore` enforces that with a hard guard. If parallel cores
 * are ever needed in one process, the follow-up is to scope the bus to a core
 * instance (pass a per-core bus into the bridges and the server) rather than
 * importing this module-level singleton.
 */
export const bus = new HelmBus()

/**
 * `ipcMain`-shaped shim. Bridges import this instead of electron's `ipcMain`;
 * the registration lands on the shared bus and is invoked over HTTP.
 */
export const ipcMain = {
  handle(channel: string, fn: IpcHandler): void {
    bus.handle(channel, fn)
  },
}
