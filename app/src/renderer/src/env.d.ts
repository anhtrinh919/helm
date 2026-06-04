/// <reference types="vite/client" />
import type { HelmApi } from '../../shared/bridge-api'

declare global {
  interface Window {
    helm?: HelmApi
  }
}

export {}
