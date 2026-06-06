import type { HelmApi } from '../../shared/bridge-api'
import { createMockBridge } from './mock-bridge'

/** Real Electron bridge if present, else an in-memory mock for browser dev/dogfood.
 *  `window` is referenced defensively so this module is import-safe under Node
 *  (unit tests) where `window` is not defined. */
const win = typeof window !== 'undefined' ? window : undefined
export const isMock = !win?.helm
export const helm: HelmApi = win?.helm ?? createMockBridge()
