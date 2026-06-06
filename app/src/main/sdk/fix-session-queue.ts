/**
 * One active fix session per project (Phase 3 — parallel sessions are Phase 4).
 * Purely in-memory: a queued card's STORED status stays 'waiting', so an app
 * relaunch simply forgets queue order and the user starts the fix again.
 */
export class FixSessionQueue {
  /** projectId → sessionId of the running fix. */
  private activeByProject = new Map<string, string>()
  /** projectId → ordered cardIds waiting behind the running fix. */
  private queueByProject = new Map<string, string[]>()

  enqueue(projectId: string, cardId: string): void {
    const q = this.queueByProject.get(projectId) ?? []
    if (!q.includes(cardId)) q.push(cardId)
    this.queueByProject.set(projectId, q)
  }

  /** Pop the next queued card, or null. */
  dequeue(projectId: string): string | null {
    const q = this.queueByProject.get(projectId)
    if (!q || q.length === 0) return null
    return q.shift() ?? null
  }

  setActive(projectId: string, sessionId: string): void {
    this.activeByProject.set(projectId, sessionId)
  }

  clearActive(projectId: string): void {
    this.activeByProject.delete(projectId)
  }

  isActive(projectId: string): boolean {
    return this.activeByProject.has(projectId)
  }

  activeSession(projectId: string): string | null {
    return this.activeByProject.get(projectId) ?? null
  }

  isQueued(projectId: string, cardId: string): boolean {
    return (this.queueByProject.get(projectId) ?? []).includes(cardId)
  }
}
