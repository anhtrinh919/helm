import { tmpdir } from 'node:os'
import type { BrowserWindow } from 'electron'
import type { Card, FeedEvent, Session, SteerMode } from '../../shared/ipc-schemas'
import { CH } from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { deriveBackgroundStatus } from '../db/projects'
import { completeBuildStep, createBuildStep, failBuildStep } from '../db/build-steps'
import type { DevServerManager } from './dev-server-manager'
import {
  findBuildingCard,
  getCard,
  setCardSession,
  setPendingCheckpoint,
  updateCardStatus,
} from '../db/cards'
import { ArtifactDirError, NotAwaitingDecisionError, SpotlightOccupiedError } from '../db/errors'
import {
  createSession,
  getSession,
  updateSessionStatus,
} from '../db/sessions'
import { appendEvent } from '../db/feed-events'
import { answerQuestion, createQuestion, nextPosition, reopenQuestion } from '../db/question-queue'
import type { DecisionPrompt, QuestionQueueItem } from '../../shared/ipc-schemas'
import { makeFeedEvent, transform } from './event-transformer'
import {
  startSession,
  type SessionCallbacks,
  type SessionHandle,
  type StartSessionOptions,
} from './session-runner'

type GetWindow = () => BrowserWindow | null
type Runner = (opts: StartSessionOptions, cb: SessionCallbacks) => SessionHandle

/**
 * Owns the lifecycle of every live scoped session: starts the SDK runner, pipes
 * transformed (user-safe) events to the renderer, persists them, and maps a
 * session's milestones onto the build-spine (building → needs-you → checkpoint).
 *
 * The runner is injectable so the orchestrator can be unit-tested without the
 * real Claude engine.
 */
export class SessionOrchestrator {
  private handles = new Map<string, SessionHandle>()
  private finalized = new Set<string>()
  /** Sessions the user deliberately stopped — their close/error is a clean halt, not a failure. */
  private interrupted = new Set<string>()
  /** Real-pipeline sessions → their build_step id (for completion / failure marking). */
  private buildStepBySession = new Map<string, string>()

  constructor(
    private db: Db,
    private getWindow: GetWindow,
    private runner: Runner = startSession,
    /**
     * When present, sessions run the REAL pipeline: real working dir, full
     * tools, build steps, and a managed dev server feeding the Live Preview.
     * When absent (Phase-1-style / unit tests), sessions stay narration-only
     * (text, sandboxed tmpdir, no tools) — the original behavior is preserved.
     */
    private devServer?: DevServerManager,
  ) {}

  private send(channel: string, payload: unknown): void {
    const win = this.getWindow()
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload)
  }

  private emit(ev: FeedEvent, rawPayload?: string | null): void {
    appendEvent(this.db, ev, rawPayload)
    this.send(CH.feedEvent, { sessionId: ev.sessionId, event: ev })
  }

  private pushBoard(card: Card): void {
    this.send(CH.boardUpdate, { projectId: card.projectId, cardId: card.id, card })
  }

  private pushBackground(projectId: string): void {
    this.send(CH.backgroundStatus, {
      projectId,
      backgroundStatus: deriveBackgroundStatus(this.db, projectId),
    })
  }

  /** A short, plain-language instruction for the engine.
   *  `real` = the Phase 2 pipeline (writes a real app + a helm.json manifest);
   *  otherwise the Phase 1 narration-only proof. */
  private buildPrompt(card: Card, real: boolean): string {
    const what = card.stepLabel ? card.stepLabel.replace(/^Step \d+ of \d+:\s*/, '') : card.title
    const shared = [
      `Narrate your progress in short, friendly, plain-English lines — one sentence per step,`,
      `as if updating a teammate who can't read code. NEVER show code, file paths, commands, or URLs.`,
      `Make routine technical choices silently — only the kind a non-developer would never care about.`,
      `When you hit a GENUINE fork that changes what the product does or how it feels`,
      `(a feature direction, a design choice, user-facing wording), STOP and ask — emit exactly one`,
      `JSON object on its own line. Prefer giving 2-4 concrete choices as buttons:`,
      `{"decision":{"question":"<plain-English question>","options":["<choice>","<choice>"]}}.`,
      `Only omit "options" when the answer truly needs their own words. Nothing else on that line.`,
    ]
    if (!real) {
      return [
        `You are building one piece of a software product for a non-technical person: "${what}".`,
        ...shared,
        `Otherwise keep narrating. Say when the first pass is ready.`,
      ].join(' ')
    }
    return [
      `You are building a real, runnable piece of a web app for a non-technical person: "${what}".`,
      `Write actual files into the current working directory to build it as a full-stack web app`,
      `(a real screen plus any backend and local data it needs) that runs locally with ONE dev command.`,
      `When the first runnable version is ready, ensure a file named "helm.json" exists in the working`,
      `directory containing exactly {"startCommand":"<dev command, e.g. npm run dev>","port":<port number it serves on>}.`,
      `Pick a port in the 3000-5999 range that is unlikely to clash.`,
      ...shared,
      `Otherwise keep narrating. Say plainly when the first runnable version is ready.`,
    ].join(' ')
  }

  /** Open a scoped session for a card and start the live build. */
  start(projectId: string, cardId: string): Session {
    const card = getCard(this.db, cardId)
    // Phase 1 hard invariant: one Building spotlight per project at a time.
    const occupied = findBuildingCard(this.db, projectId)
    if (occupied && occupied.id !== cardId) {
      throw new SpotlightOccupiedError(occupied.sessionId ?? '')
    }

    const session = createSession(this.db, projectId, cardId, card.stepLabel ?? card.title)
    setCardSession(this.db, cardId, session.id)

    let building = card
    if (card.status !== 'building') {
      try {
        building = updateCardStatus(this.db, cardId, 'building')
      } catch {
        building = card
      }
    }
    this.pushBoard(building)
    this.pushBackground(projectId)

    // Phase 2 real pipeline: real working dir + full tools + a managed dev
    // server. Without a DevServerManager we keep the Phase 1 narration-only path
    // (sandboxed tmpdir, no tools) so existing behavior is preserved.
    const real = !!this.devServer
    let cwd = tmpdir()
    let allowedTools: string[] | undefined = []
    if (real && this.devServer) {
      try {
        cwd = this.devServer.ensureArtifactDir(projectId)
      } catch (e) {
        throw new ArtifactDirError(e instanceof Error ? e.message : 'could not create working directory')
      }
      allowedTools = undefined // all tools enabled
      const step = createBuildStep(this.db, projectId, session.id, cardId)
      this.buildStepBySession.set(session.id, step.id)
      this.devServer.markBuilding(projectId)
    }

    const handle = this.runner(
      {
        prompt: this.buildPrompt(card, real),
        cwd,
        permissionMode: real ? 'bypassPermissions' : 'default',
        allowedTools,
      },
      {
        onMessage: (msg) => {
          const raw = JSON.stringify(msg)
          for (const ev of transform(session.id, msg)) {
            this.ingest(session.id, projectId, cardId, ev, raw)
          }
        },
        onError: (message) => this.fail(session.id, projectId, cardId, message),
        onClose: () => this.finish(session.id, projectId, cardId),
      },
    )
    this.handles.set(session.id, handle)
    return session
  }

  private ingest(
    sessionId: string,
    projectId: string,
    cardId: string,
    ev: FeedEvent,
    rawPayload?: string | null,
  ): void {
    // 'summary' ("Done.") is superseded by the reviewable checkpoint we emit on finish.
    if (ev.kind === 'summary') return
    if (ev.kind === 'decision_prompt') {
      this.pause(sessionId, projectId, cardId, ev.text, ev.options)
      return
    }
    this.emit(ev, rawPayload)
  }

  /** The engine asked for a genuine decision: queue it and pause the build.
   *  Options (if the engine offered any) make it a tap-a-button card; else free text. */
  private pause(
    sessionId: string,
    projectId: string,
    cardId: string,
    question: string,
    options?: string[],
  ): void {
    const prompt: DecisionPrompt =
      options && options.length
        ? { type: 'buttons', question, options }
        : { type: 'freetext', question }
    const q = createQuestion(this.db, sessionId, prompt, nextPosition(this.db, sessionId))
    this.emit(makeFeedEvent(sessionId, 'decision_prompt', question, q.id))
    this.send(CH.questionUpdate, { sessionId, question: q })
    updateSessionStatus(this.db, sessionId, 'paused_for_decision')
    try {
      this.pushBoard(updateCardStatus(this.db, cardId, 'needs_you'))
    } catch {
      /* card may already be in a terminal-ish state */
    }
    this.pushBackground(projectId)
  }

  /** Steer a running session. Returns false if the session isn't live.
   *  'interrupt' is a deliberate stop: mark it so the resulting close is a clean
   *  halt (not an error), then let the engine abort. */
  steer(sessionId: string, mode: SteerMode, text: string): boolean {
    const handle = this.handles.get(sessionId)
    if (!handle) return false
    if (mode === 'interrupt') this.interrupted.add(sessionId)
    this.emit(makeFeedEvent(sessionId, 'steering', steeringLabel(mode, text)))
    void handle.steer(mode, text)
    return true
  }

  /** Answer a pending decision: record it, resume the session, un-block the card. */
  answerDecision(sessionId: string, questionId: string, answer: string): void {
    if (getSession(this.db, sessionId).status !== 'paused_for_decision') {
      throw new NotAwaitingDecisionError('session is not waiting on a decision')
    }
    const question = answerQuestion(this.db, questionId, answer)
    this.send(CH.questionUpdate, { sessionId, question })
    this.emit(makeFeedEvent(sessionId, 'narration', `You answered: ${answer}`))

    const session = getSession(this.db, sessionId)
    if (session.cardId) {
      try {
        this.pushBoard(updateCardStatus(this.db, session.cardId, 'building'))
      } catch {
        /* already building */
      }
    }
    updateSessionStatus(this.db, sessionId, 'active')
    this.pushBackground(session.projectId)

    const handle = this.handles.get(sessionId)
    if (handle) handle.reply(answer)
  }

  /** Re-open an answered decision: re-block the build and wait for a new answer. */
  reopen(sessionId: string, questionId: string): QuestionQueueItem {
    const question = reopenQuestion(this.db, questionId) // throws if still pending
    this.send(CH.questionUpdate, { sessionId, question })
    this.emit(
      makeFeedEvent(
        sessionId,
        'narration',
        'You re-opened a question — I’ll wait for your updated answer.',
      ),
    )
    updateSessionStatus(this.db, sessionId, 'paused_for_decision')
    const session = getSession(this.db, sessionId)
    if (session.cardId) {
      try {
        this.pushBoard(updateCardStatus(this.db, session.cardId, 'needs_you'))
      } catch {
        /* card may not allow the transition */
      }
    }
    this.pushBackground(session.projectId)
    const handle = this.handles.get(sessionId)
    if (handle) handle.reply(`I want to reconsider: ${question.prompt.question}`)
    return question
  }

  private finish(sessionId: string, projectId: string, cardId: string): void {
    if (this.finalized.has(sessionId)) return
    if (this.interrupted.has(sessionId)) return this.halt(sessionId, projectId, cardId)
    this.finalized.add(sessionId)
    this.handles.delete(sessionId)

    updateSessionStatus(this.db, sessionId, 'done')

    // Real pipeline: complete the build step, then bring the dev server up. The
    // reviewable checkpoint waits until the running app is live (or the manager
    // reports it blocked) — the user reviews the running app, not a blank pane.
    const buildStepId = this.buildStepBySession.get(sessionId)
    if (this.devServer && buildStepId) {
      this.buildStepBySession.delete(sessionId)
      completeBuildStep(this.db, buildStepId, null)
      void this.devServer
        .restart(projectId)
        .then((url) => {
          completeBuildStep(this.db, buildStepId, url)
          this.emitCheckpoint(sessionId, projectId, cardId)
        })
        .catch(() => {
          // Dev server couldn't come up — preview is 'blocked'. Still let the
          // user review/act on what was built.
          this.emitCheckpoint(sessionId, projectId, cardId)
        })
      return
    }

    this.emitCheckpoint(sessionId, projectId, cardId)
  }

  /** Move the card to its reviewable checkpoint and tell the renderer. */
  private emitCheckpoint(sessionId: string, projectId: string, cardId: string): void {
    const card = setPendingCheckpoint(this.db, cardId)
    this.pushBoard(card)
    this.emit(
      makeFeedEvent(sessionId, 'checkpoint', 'Here’s what I built — does this look right?', cardId),
    )
    this.pushBackground(projectId)
  }

  private fail(sessionId: string, projectId: string, cardId: string, message: string): void {
    if (this.finalized.has(sessionId)) return
    if (this.interrupted.has(sessionId)) return this.halt(sessionId, projectId, cardId)
    this.finalized.add(sessionId)
    this.handles.delete(sessionId)

    updateSessionStatus(this.db, sessionId, 'error')

    // Real pipeline: mark the build step failed and let the preview show a snag /
    // blocked state (the dev server can't be brought up around a failed build).
    const buildStepId = this.buildStepBySession.get(sessionId)
    if (this.devServer && buildStepId) {
      this.buildStepBySession.delete(sessionId)
      failBuildStep(this.db, buildStepId)
      void this.devServer.handleCrash(projectId)
    }

    this.emit(makeFeedEvent(sessionId, 'error', message))
    try {
      this.pushBoard(updateCardStatus(this.db, cardId, 'failed'))
    } catch {
      /* best effort */
    }
    this.pushBackground(projectId)
  }

  /** A user-initiated stop. Ends the session calmly — no error, no checkpoint —
   *  and returns the card to up_next so it can be picked back up. */
  private halt(sessionId: string, projectId: string, cardId: string): void {
    if (this.finalized.has(sessionId)) return
    this.finalized.add(sessionId)
    this.interrupted.delete(sessionId)
    this.handles.delete(sessionId)

    updateSessionStatus(this.db, sessionId, 'stopped')
    this.emit(makeFeedEvent(sessionId, 'stopped', 'You stopped this build — your place is saved.'))
    try {
      this.pushBoard(updateCardStatus(this.db, cardId, 'up_next'))
    } catch {
      /* card may not allow the transition — leave it as-is */
    }
    this.pushBackground(projectId)
  }
}

function steeringLabel(mode: SteerMode, text: string): string {
  const verb = mode === 'interrupt' ? 'Asked it to stop' : mode === 'redirect' ? 'Redirected it' : 'Asked it to look closer'
  return `${verb}: ${text}`
}
