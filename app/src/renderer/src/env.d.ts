/// <reference types="vite/client" />
import type { StartProbeResponse, GetFeedResponse, FeedEventPush } from '../../shared/ipc-schemas'

declare global {
  interface Window {
    helm: {
      startProbe(prompt: string): Promise<StartProbeResponse>
      getFeed(sessionId: string): Promise<GetFeedResponse>
      onFeedEvent(cb: (push: FeedEventPush) => void): () => void
    }
  }
}

export {}
