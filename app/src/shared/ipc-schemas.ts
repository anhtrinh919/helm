import { z } from 'zod'

/**
 * Single source of truth for every value that crosses the IPC boundary.
 * Both main and renderer import from this file. No raw SDK payload type is
 * ever exported to the renderer — only the transformed shapes below.
 */

export const FeedEventKind = z.enum([
  'narration',
  'activity',
  'decision_prompt',
  'steering',
  'checkpoint',
  'summary',
  'error',
])
export type FeedEventKind = z.infer<typeof FeedEventKind>

/** A transformed, user-safe feed event. `rawPayload` stays in main/DB and is never sent to the renderer. */
export const FeedEvent = z.object({
  id: z.string(),
  sessionId: z.string(),
  kind: FeedEventKind,
  text: z.string(),
  createdAt: z.number(),
})
export type FeedEvent = z.infer<typeof FeedEvent>

export const SteerMode = z.enum(['interrupt', 'redirect', 'look_closer'])
export type SteerMode = z.infer<typeof SteerMode>

/* --- Group 1 IPC channel payloads (engine-plumbing proof) --- */

export const StartProbeRequest = z.object({ prompt: z.string().min(1).max(5000) })
export type StartProbeRequest = z.infer<typeof StartProbeRequest>

export const StartProbeResponse = z.object({ sessionId: z.string() })
export type StartProbeResponse = z.infer<typeof StartProbeResponse>

export const GetFeedRequest = z.object({ sessionId: z.string(), afterId: z.string().optional() })
export type GetFeedRequest = z.infer<typeof GetFeedRequest>

export const GetFeedResponse = z.object({ events: z.array(FeedEvent) })
export type GetFeedResponse = z.infer<typeof GetFeedResponse>

export const FeedEventPush = z.object({ sessionId: z.string(), event: FeedEvent })
export type FeedEventPush = z.infer<typeof FeedEventPush>

/** Named IPC channels. */
export const CH = {
  startProbe: 'sessions:start-probe',
  getFeed: 'sessions:get-feed',
  feedEvent: 'feed:event',
} as const
