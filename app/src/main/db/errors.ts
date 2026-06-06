/** Typed DB errors. IPC handlers translate these into the contract's error shapes. */

export class NotFoundError extends Error {
  readonly code = 'not_found' as const
}

export class InvalidTransitionError extends Error {
  readonly code = 'invalid_transition' as const
  constructor(
    readonly from: string,
    readonly to: string,
  ) {
    super(`invalid transition ${from} → ${to}`)
  }
}

export class CannotReopenError extends Error {
  readonly code = 'cannot_reopen' as const
}

export class NoCheckpointError extends Error {
  readonly code = 'no_checkpoint' as const
}

/** Another card in the project is already in the Building spotlight (Phase 1: one at a time). */
export class SpotlightOccupiedError extends Error {
  readonly code = 'session_already_active' as const
  constructor(readonly sessionId: string) {
    super('another card is already building')
  }
}

/** Tried to answer a decision on a session that isn't paused for one. */
export class NotAwaitingDecisionError extends Error {
  readonly code = 'not_awaiting_decision' as const
}

/* ---- Phase 2: dev-server / preview errors ---- */

/** No runnable artifact exists yet (build hasn't produced a helm.json / app). */
export class NoArtifactError extends Error {
  readonly code = 'no_artifact' as const
}

/** The dev server is already running — carries the existing URL. */
export class AlreadyRunningError extends Error {
  readonly code = 'already_running' as const
  constructor(readonly url: string) {
    super('dev server already running')
  }
}

/** The dev server process failed to start or never bound in time. */
export class StartFailedError extends Error {
  readonly code = 'start_failed' as const
}

/** Asked to stop a dev server that isn't running. */
export class DevServerNotRunningError extends Error {
  readonly code = 'not_running' as const
}

/** Could not create the project's on-disk working directory (real pipeline). */
export class ArtifactDirError extends Error {
  readonly code = 'artifact_dir_failed' as const
}
