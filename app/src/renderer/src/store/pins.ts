import { create } from 'zustand'
import { helm } from '../bridge'
import {
  isIpcError,
  type BoundingBox,
  type FixCommentPin,
  type NoteType,
} from '@shared/ipc-schemas'

/** Stable empty lists so selectors never return a fresh reference. */
export const NO_PINS: FixCommentPin[] = []
export const NO_QUEUED: string[] = []

/**
 * A locked selection waiting for its note. Geometry only — the selector and
 * screenshot never reach the renderer; main merges its pending capture when
 * the comment registers.
 */
export interface LockedCapture {
  boundingBox: BoundingBox
  pinX: number
  pinY: number
}

interface PointFixStore {
  /** Open (unresolved) pins per project. */
  pins: Record<string, FixCommentPin[]>
  /** Cards queued behind the running fix per project (pushed by main — the
   *  board holds no copy of this fact). */
  queued: Record<string, string[]>
  /** Point mode on/off per project. */
  pointMode: Record<string, boolean>
  /** The locked element selection per project (comment box open). */
  capture: Record<string, LockedCapture | null>
  /** Whole-page comment box open per project. */
  pageComment: Record<string, boolean>
  /** Brief "sent to the board" flash after a successful register. */
  justFiled: Record<string, boolean>

  setPins: (projectId: string, pins: FixCommentPin[], queuedCardIds: string[]) => void
  loadPins: (projectId: string) => Promise<void>
  /** Subscribe to pins + capture pushes. Returns an unsubscribe fn. */
  subscribe: () => () => void

  enterPointMode: (projectId: string) => void
  exitPointMode: (projectId: string) => void
  lockCapture: (projectId: string, capture: LockedCapture) => void
  clearCapture: (projectId: string) => void
  openPageComment: (projectId: string) => void
  /** File the comment. Resolves true on success (box closes, point mode exits). */
  register: (projectId: string, note: string, noteType: NoteType) => Promise<boolean>
}

export const usePointFix = create<PointFixStore>((set, get) => ({
  pins: {},
  queued: {},
  pointMode: {},
  capture: {},
  pageComment: {},
  justFiled: {},

  setPins: (projectId, pins, queuedCardIds) =>
    set((s) => ({
      pins: { ...s.pins, [projectId]: pins },
      queued: { ...s.queued, [projectId]: queuedCardIds },
    })),

  loadPins: async (projectId) => {
    const res = await helm.points.list(projectId)
    if (!isIpcError(res)) get().setPins(projectId, res.pins, res.queuedCardIds)
  },

  subscribe: () => {
    const offPins = helm.events.onPinsUpdate((p) => get().setPins(p.projectId, p.pins, p.queuedCardIds))
    const offCapture = helm.events.onPointCapture((p) => {
      if (p.kind === 'captured') {
        get().lockCapture(p.projectId, {
          boundingBox: p.boundingBox,
          pinX: p.pinX,
          pinY: p.pinY,
        })
      } else {
        get().exitPointMode(p.projectId)
      }
    })
    return () => {
      offPins()
      offCapture()
    }
  },

  enterPointMode: (projectId) => {
    void helm.points.activate(projectId)
    set((s) => ({ pointMode: { ...s.pointMode, [projectId]: true } }))
  },

  exitPointMode: (projectId) => {
    void helm.points.deactivate(projectId)
    set((s) => ({
      pointMode: { ...s.pointMode, [projectId]: false },
      capture: { ...s.capture, [projectId]: null },
      pageComment: { ...s.pageComment, [projectId]: false },
    }))
  },

  lockCapture: (projectId, capture) =>
    set((s) => ({
      capture: { ...s.capture, [projectId]: capture },
      pageComment: { ...s.pageComment, [projectId]: false },
    })),

  clearCapture: (projectId) =>
    set((s) => ({
      capture: { ...s.capture, [projectId]: null },
      pageComment: { ...s.pageComment, [projectId]: false },
    })),

  openPageComment: (projectId) =>
    set((s) => ({
      pageComment: { ...s.pageComment, [projectId]: true },
      capture: { ...s.capture, [projectId]: null },
    })),

  register: async (projectId, note, noteType) => {
    const capture = get().capture[projectId]
    const res = await helm.points.register({
      projectId,
      note,
      noteType,
      ...(capture
        ? { boundingBox: capture.boundingBox, pinX: capture.pinX, pinY: capture.pinY }
        : {}),
    })
    if (isIpcError(res)) return false
    get().exitPointMode(projectId)
    set((s) => ({ justFiled: { ...s.justFiled, [projectId]: true } }))
    setTimeout(
      () => set((s) => ({ justFiled: { ...s.justFiled, [projectId]: false } })),
      2400,
    )
    return true
  },
}))
