import type { Db } from '../db/connection'
import { listProjectsWithArtifacts, setDevPid } from '../db/projects'
import type { DevServerManager } from './dev-server-manager'

/**
 * On app launch, reconnect or restart the dev server for every project that has
 * real artifacts, so the Live Preview is there when the user reopens a project.
 * Runs after migrations + IPC handlers are registered.
 */
export async function resumeDevServers(db: Db, devServer: DevServerManager): Promise<void> {
  for (const p of listProjectsWithArtifacts(db)) {
    await devServer.resume(p.id)
  }
}

/**
 * On clean quit, clear every project's stored dev PID. Child processes spawned
 * by the manager die with the app, so a persisted PID would be stale on the
 * next launch — clearing them avoids ever matching an unrelated process.
 */
export function clearAllDevPids(db: Db): void {
  for (const p of listProjectsWithArtifacts(db)) {
    if (p.devPid != null) setDevPid(db, p.id, null)
  }
}
