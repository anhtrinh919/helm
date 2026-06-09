import { join } from 'node:path'
import { app, BrowserWindow } from 'electron'
import { startCore, type RunningCore } from './core'
import { defaultPointCaptureDeps } from './sdk/point-capture-electron'

/**
 * Electron shipping shell (Phase 1, Group 0 — hybrid runtime).
 *
 * The shell does almost nothing: it starts the local core (the HTTP/WS server +
 * all the real logic) and opens a BrowserWindow pointed at the core's localhost
 * URL. The renderer connects back over the same `helm` HTTP/WebSocket bridge a
 * browser would use — there is no preload and no Electron IPC. Electron only adds
 * the packaged window and the <webview> the live preview embeds.
 */

let mainWindow: BrowserWindow | null = null
let core: RunningCore | null = null

function createWindow(url: string): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#E7E7DB', // Dot-Matrix bone paper — avoid white flash on launch
    webPreferences: {
      // No preload: the renderer reaches the core over HTTP/WS like any browser.
      // The embedded app still loads in a <webview> with no Node access.
      webviewTag: true,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  void mainWindow.loadURL(url)
}

void app.whenReady().then(async () => {
  core = await startCore({
    dataDir: app.getPath('userData'),
    // The core serves the built renderer it bundles; in dev the same source is
    // served by Vite. SPA fallback handles client routes.
    staticDir: join(import.meta.dirname, '../renderer'),
    // In the shell, point-capture adapts live <webview> guests (browser uses the
    // Group 5 proxy instead).
    pointCapture: defaultPointCaptureDeps,
  })

  createWindow(core.url)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && core) createWindow(core.url)
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  void core?.close()
})
