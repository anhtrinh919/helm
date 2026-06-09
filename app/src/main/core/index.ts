import { join } from 'node:path'
import { CH, type PreviewState } from '../../shared/ipc-schemas'
import { openDatabase, type Db } from '../db/connection'
import { recoverActiveSessions } from '../db/sessions'
import { mapLegacyProjects } from '../db/projects'
import { registerFeedBridge } from '../ipc/feed-bridge'
import { registerDataBridge } from '../ipc/data-bridge'
import { registerSessionBridge } from '../ipc/session-bridge'
import { registerWizardBridge } from '../ipc/wizard-bridge'
import { registerPreviewBridge } from '../ipc/preview-bridge'
import { registerPointsBridge } from '../ipc/points-bridge'
import { registerHistoryBridge } from '../ipc/history-bridge'
import { registerProjectManagementBridge } from '../ipc/project-management-bridge'
import { registerShelfBridge } from '../ipc/shelf-bridge'
import { registerImportBridge } from '../ipc/import-bridge'
import { SessionOrchestrator } from '../sdk/session-orchestrator'
import { DevServerManager } from '../sdk/dev-server-manager'
import { WizardOrchestrator } from '../sdk/wizard-orchestrator'
import { PointCaptureService, type PointCaptureDeps } from '../sdk/point-capture-service'
import { bus, type HelmWindow } from './transport'
import { startServer, type RunningServer } from './server'

/**
 * The headless core (Phase 1, Group 0). All the wiring that used to live inside
 * Electron's `whenReady` — DB + migrations, the orchestrators, every bridge —
 * lives here and runs the same whether launched by the Electron shell or by a
 * plain Node process for the localhost dogfood. The only transport is the local
 * HTTP/WS server; pushes go through the bus's synthetic window.
 *
 * Electron-specific pieces (the userData path, the <webview> point-capture
 * injection) are injected via `CoreOptions`, so this module never imports electron.
 */

export interface CoreOptions {
  /** Where the SQLite DB and project working dirs live (Electron: userData). */
  dataDir: string
  /** Preferred port; 0 picks an ephemeral free port. */
  port?: number
  /** Built-renderer dir to serve in production. Omit in dev (Vite serves the UI). */
  staticDir?: string
  /**
   * Point-and-fix capture wiring. In the Electron shell this adapts live
   * <webview> guests; headless (browser dogfood) it defaults to a no-op until the
   * Group 5 preview proxy provides same-origin injection. The factory receives the
   * dev-server manager so it can resolve live preview URLs.
   */
  pointCapture?: (devServer: DevServerManager) => PointCaptureDeps
}

export interface RunningCore {
  db: Db
  devServer: DevServerManager
  port: number
  url: string
  close(): Promise<void>
}

/** Headless point-capture deps: no embedded guests until the Group 5 proxy lands. */
function noopPointCapture(devServer: DevServerManager): PointCaptureDeps {
  return {
    listGuests: () => [],
    previewUrl: (projectId) => {
      const state = devServer.getState(projectId)
      return state.status === 'live' ? state.url : null
    },
  }
}

export async function startCore(opts: CoreOptions): Promise<RunningCore> {
  // DB + migrations must run before any bridge is registered.
  const db: Db = openDatabase(join(opts.dataDir, 'helm.db'))
  recoverActiveSessions(db, Date.now())
  // Place pre-modes projects on the right surface (Build rail vs Iterate board).
  mapLegacyProjects(db)

  // One push path for everyone: the synthetic window fans webContents.send out to
  // every connected WebSocket client via the bus.
  const win: HelmWindow = bus.window()
  const getWindow = (): HelmWindow => win
  const send = (channel: string, payload: unknown): void => bus.broadcast(channel, payload)

  const devServer = new DevServerManager(
    db,
    (projectId: string, state: PreviewState) => send(CH.previewUpdate, { projectId, state }),
    undefined,
    join(opts.dataDir, 'projects'),
  )

  const orchestrator = new SessionOrchestrator(db, getWindow, undefined, devServer)
  const wizard = new WizardOrchestrator(db)

  const pointCapture = new PointCaptureService(
    (opts.pointCapture ?? noopPointCapture)(devServer),
    (projectId, g) => send(CH.pointCaptured, { kind: 'captured', projectId, ...g }),
    (projectId) => send(CH.pointCaptured, { kind: 'exit', projectId }),
  )

  registerFeedBridge(db, getWindow)
  registerDataBridge(db, getWindow, { orchestrator })
  registerSessionBridge(db, orchestrator)
  registerWizardBridge(db, wizard, getWindow)
  registerPreviewBridge(db, devServer)
  registerHistoryBridge(db)
  registerProjectManagementBridge(db, devServer)
  registerShelfBridge(db, getWindow)
  registerImportBridge(db, devServer)
  registerPointsBridge(db, { capture: pointCapture, devServer, orchestrator, getWindow })

  const server: RunningServer = await startServer({ port: opts.port, staticDir: opts.staticDir })

  // Reconnect or restart each project's dev server so the Live Preview survives
  // a relaunch. Non-blocking — the server is already accepting requests.
  void devServer.resumeAll()

  return {
    db,
    devServer,
    port: server.port,
    url: `http://127.0.0.1:${server.port}`,
    close: async () => {
      devServer.clearAllPids()
      await server.close()
    },
  }
}
