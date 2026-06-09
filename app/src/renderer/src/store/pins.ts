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
  /** Whether the captured element contains visible text (drives dual-choice vs single-choice popover). */
  isTextElement?: boolean
}

/** The in-place text-edit state for a single project. */
export interface TextEditState {
  /** 'armed' = activateTextEdit called, waiting for user to click element in preview.
   *  'editing' = element has been clicked, inline editor active, user is typing.
   *  'submitting' = registerTextEdit in-flight. */
  phase: 'armed' | 'editing' | 'submitting'
  /** Filled once the user has clicked an element in text-edit mode. */
  selector?: string
  oldText?: string
  /** Brief result message shown after submission ('no_change' | 'reload' | 'error'). */
  flash?: 'no_change' | 'reload' | 'error'
}

/** Double-submit guard: cardIds for which a fix session is already in flight. */
type InFlightSet = Set<string>

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
  /** Inline text-edit state per project. null = not active. */
  textEdit: Record<string, TextEditState | null>
  /** Element selectors for which a fix session was already fired (double-submit guard). */
  inFlight: Record<string, InFlightSet>

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

  /** Arm inline text-edit mode (calls activateTextEdit on main). */
  enterTextEdit: (projectId: string) => Promise<boolean>
  /** Cancel / tear down inline text-edit mode without registering. */
  exitTextEdit: (projectId: string) => void
  /** Called by the overlay when the user has finished editing text in the preview.
   *  selector/oldText/newText come from the injected script's report. */
  commitTextEdit: (
    projectId: string,
    selector: string,
    oldText: string,
    newText: string,
  ) => Promise<void>
  /** Clear any text-edit flash message. */
  clearTextEditFlash: (projectId: string) => void
  /** Mark a selector as in-flight (double-submit guard). */
  markInFlight: (projectId: string, selector: string) => void
  /** Release an in-flight selector (card appeared on board). */
  clearInFlight: (projectId: string, selector: string) => void
  isInFlight: (projectId: string, selector: string) => boolean
}

export const usePointFix = create<PointFixStore>((set, get) => ({
  pins: {},
  queued: {},
  pointMode: {},
  capture: {},
  pageComment: {},
  justFiled: {},
  textEdit: {},
  inFlight: {},

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
    // Also tear down text-edit mode if it was active under point mode.
    if (get().textEdit[projectId]) void helm.points.deactivateTextEdit(projectId)
    set((s) => ({
      pointMode: { ...s.pointMode, [projectId]: false },
      capture: { ...s.capture, [projectId]: null },
      pageComment: { ...s.pageComment, [projectId]: false },
      textEdit: { ...s.textEdit, [projectId]: null },
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

  enterTextEdit: async (projectId) => {
    const res = await helm.points.activateTextEdit(projectId)
    if (isIpcError(res)) return false
    set((s) => ({
      textEdit: { ...s.textEdit, [projectId]: { phase: 'armed' } },
      // exit regular capture if open
      capture: { ...s.capture, [projectId]: null },
      pageComment: { ...s.pageComment, [projectId]: false },
    }))
    return true
  },

  exitTextEdit: (projectId) => {
    void helm.points.deactivateTextEdit(projectId)
    set((s) => ({ textEdit: { ...s.textEdit, [projectId]: null } }))
  },

  commitTextEdit: async (projectId, selector, oldText, newText) => {
    set((s) => ({
      textEdit: { ...s.textEdit, [projectId]: { phase: 'submitting', selector, oldText } },
    }))
    const res = await helm.points.registerTextEdit({ projectId, selector, oldText, newText })
    if (isIpcError(res)) {
      const err = res as { error: string }
      if (err.error === 'no_change') {
        set((s) => ({
          textEdit: { ...s.textEdit, [projectId]: { phase: 'armed', flash: 'no_change' } },
        }))
      } else {
        set((s) => ({
          textEdit: { ...s.textEdit, [projectId]: { phase: 'armed', flash: 'error' } },
        }))
      }
      return
    }
    // Success: exit text-edit, deactivate on main, mark in-flight for double-submit guard
    void helm.points.deactivateTextEdit(projectId)
    get().markInFlight(projectId, selector)
    set((s) => ({
      textEdit: { ...s.textEdit, [projectId]: null },
      justFiled: { ...s.justFiled, [projectId]: true },
    }))
    setTimeout(
      () => set((s) => ({ justFiled: { ...s.justFiled, [projectId]: false } })),
      2400,
    )
  },

  clearTextEditFlash: (projectId) =>
    set((s) => {
      const current = s.textEdit[projectId]
      if (!current) return s
      return { textEdit: { ...s.textEdit, [projectId]: { ...current, flash: undefined } } }
    }),

  markInFlight: (projectId, selector) =>
    set((s) => {
      const existing = s.inFlight[projectId] ?? new Set<string>()
      const next = new Set(existing)
      next.add(selector)
      return { inFlight: { ...s.inFlight, [projectId]: next } }
    }),

  clearInFlight: (projectId, selector) =>
    set((s) => {
      const existing = s.inFlight[projectId]
      if (!existing) return s
      const next = new Set(existing)
      next.delete(selector)
      return { inFlight: { ...s.inFlight, [projectId]: next } }
    }),

  isInFlight: (projectId, selector) => get().inFlight[projectId]?.has(selector) ?? false,
}))
