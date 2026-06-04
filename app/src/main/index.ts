import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { openDatabase, type Db } from './db/connection'
import { recoverActiveSessions } from './db/sessions'
import { registerFeedBridge } from './ipc/feed-bridge'
import { registerDataBridge } from './ipc/data-bridge'
import { registerSessionBridge } from './ipc/session-bridge'
import { registerWizardBridge } from './ipc/wizard-bridge'
import { SessionOrchestrator } from './sdk/session-orchestrator'
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
  const orchestrator = new SessionOrchestrator(db, getWindow)
  const wizard = new WizardOrchestrator(db)
  registerFeedBridge(getWindow)
  registerDataBridge(db, getWindow)
  registerSessionBridge(db, orchestrator)
  registerWizardBridge(db, wizard, getWindow)

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
