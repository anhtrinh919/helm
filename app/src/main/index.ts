import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { CH, type PreviewState } from '../shared/ipc-schemas'
import { openDatabase, type Db } from './db/connection'
import { recoverActiveSessions } from './db/sessions'
import { registerFeedBridge } from './ipc/feed-bridge'
import { registerDataBridge } from './ipc/data-bridge'
import { registerSessionBridge } from './ipc/session-bridge'
import { registerWizardBridge } from './ipc/wizard-bridge'
import { registerPreviewBridge } from './ipc/preview-bridge'
import { SessionOrchestrator } from './sdk/session-orchestrator'
import { DevServerManager } from './sdk/dev-server-manager'
import { WizardOrchestrator } from './sdk/wizard-orchestrator'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#FFEFD2', // v4 canvas — avoid white flash on launch
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      sandbox: false,
      // Live Preview embeds the built app's running dev server in a <webview>.
      // The embedded app gets NO Node access (contextIsolation default + no
      // nodeIntegration); it is just a rendered URL.
      webviewTag: true,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) void mainWindow.loadURL(devUrl)
  else void mainWindow.loadFile(join(import.meta.dirname, '../renderer/index.html'))
}

void app.whenReady().then(() => {
  // DB + migrations must run before any IPC handler is registered.
  const db: Db = openDatabase(join(app.getPath('userData'), 'helm.db'))
  recoverActiveSessions(db, Date.now())

  const getWindow = (): BrowserWindow | null => mainWindow
  const send = (channel: string, payload: unknown): void => {
    const win = getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }

  // The dev server feeds the Live Preview: every state change is pushed to the
  // renderer. Each project's app lives under userData/projects/<id> (hidden).
  const devServer = new DevServerManager(
    db,
    (projectId: string, state: PreviewState) => send(CH.previewUpdate, { projectId, state }),
    undefined,
    join(app.getPath('userData'), 'projects'),
  )

  const orchestrator = new SessionOrchestrator(db, getWindow, undefined, devServer)
  const wizard = new WizardOrchestrator(db)
  registerFeedBridge(db, getWindow)
  registerDataBridge(db, getWindow)
  registerSessionBridge(db, orchestrator)
  registerWizardBridge(db, wizard, getWindow)
  registerPreviewBridge(db, devServer)

  createWindow()
  // Reconnect or restart each project's dev server so the Live Preview survives
  // an app relaunch. Non-blocking — the window shows immediately.
  void devServer.resumeAll()

  // Clear stored dev PIDs on quit; the child processes die with the app, so a
  // persisted PID would be stale next launch.
  app.on('before-quit', () => devServer.clearAllPids())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
