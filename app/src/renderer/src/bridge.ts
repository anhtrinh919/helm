import type { HelmApi } from '../../shared/bridge-api'
import { createMockBridge } from './mock-bridge'

/** Real Electron bridge if present, else an in-memory mock for browser dev/dogfood. */
export const isMock = typeof window === 'undefined' || !window.helm
export const helm: HelmApi = window.helm ?? createMockBridge()
