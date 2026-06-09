import type { HelmApi } from '../../shared/bridge-api'
import { createHttpBridge } from './http-bridge'
import { createMockBridge } from './mock-bridge'

/**
 * The renderer's single `helm` seam. In the hybrid runtime the UI always talks to
 * the real local core over the HTTP/WebSocket bridge — whether it runs in a plain
 * browser at localhost or inside the Electron shell (which is just Chromium pointed
 * at the same core URL). The in-memory mock survives only behind `?mock` for pure
 * offline visual review; it is no longer the dogfood vehicle.
 *
 * `window` is referenced defensively so this module is import-safe under Node
 * (unit tests) where `window` is not defined.
 */
const isTest = import.meta.env?.MODE === 'test'
const wantsMockParam =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('mock')
// Real app (browser or Electron shell) → the live core over HTTP/WS. Unit tests
// and explicit `?mock` → the in-memory mock.
const wantsMock = isTest || wantsMockParam

export const isMock = wantsMock
export const helm: HelmApi = wantsMock ? createMockBridge() : createHttpBridge()
