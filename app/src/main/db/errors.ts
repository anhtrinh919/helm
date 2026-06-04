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
