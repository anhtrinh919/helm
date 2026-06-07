import { app, type WebContents } from 'electron'
import type { BoundingBox } from '../../shared/ipc-schemas'
import type { DevServerManager } from './dev-server-manager'
import type { GuestView, PointCaptureDeps } from './point-capture-service'

/**
 * Production wiring for PointCaptureService: tracks every <webview> guest as it
 * attaches and adapts Electron's WebContents to the service's GuestView shape.
 * Kept separate so the service itself stays Electron-free (unit-testable).
 */

const MAX_CROP = 512

function adapt(contents: WebContents): GuestView {
  return {
    executeJavaScript: (code) => contents.executeJavaScript(code).catch(() => undefined),
    captureRegion: async (rect: BoundingBox) => {
      try {
        const image = await contents.capturePage({
          x: Math.max(0, Math.round(rect.x)),
          y: Math.max(0, Math.round(rect.y)),
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
        })
        const { width, height } = image.getSize()
        const scale = Math.min(1, MAX_CROP / Math.max(width, height, 1))
        const sized =
          scale < 1
            ? image.resize({ width: Math.round(width * scale), height: Math.round(height * scale) })
            : image
        return sized.toPNG().toString('base64')
      } catch {
        return '' // capture failure never blocks filing the comment
      }
    },
    onConsole: (cb) => {
      const listener = (_e: unknown, _level: number, message: string): void => cb(message)
      contents.on('console-message', listener as never)
      return () => contents.removeListener('console-message', listener as never)
    },
  }
}

/** Track webview guests app-wide; expose them + live-preview URLs as deps. */
export function defaultPointCaptureDeps(devServer: DevServerManager): PointCaptureDeps {
  const guests = new Set<WebContents>()
  app.on('web-contents-created', (_e, contents) => {
    if (contents.getType() !== 'webview') return
    guests.add(contents)
    contents.on('destroyed', () => guests.delete(contents))
  })
  return {
    listGuests: () =>
      [...guests]
        .filter((c) => !c.isDestroyed())
        .map((c) => ({ url: c.getURL(), view: adapt(c) })),
    previewUrl: (projectId) => {
      const state = devServer.getState(projectId)
      return state.status === 'live' ? state.url : null
    },
  }
}
