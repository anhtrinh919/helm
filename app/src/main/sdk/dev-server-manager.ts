import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { get as httpGet } from 'node:http'
import { z } from 'zod'
import type { PreviewState } from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import { getArtifactDir, setArtifactDir, setDevPid } from '../db/projects'
import { AlreadyRunningError, NoArtifactError, StartFailedError } from '../db/errors'

/**
 * Owns the per-project dev server as a child process. This is the ONLY place
 * `artifact_dir` resolution and `dev_pid` tracking live. It drives the Live
 * Preview state machine (none → building → live → snag → blocked) and reports
 * every transition through an injected `onStateChange` callback so the
 * orchestrator/main can push `preview:update` to the renderer.
 *
 * All process I/O (spawn, HTTP probe, manifest read, PID-liveness) is injected
 * so the manager can be unit-tested without a real server.
 */

/** Internal manifest the build agent writes into artifact_dir. Never exposed to the renderer. */
export const HelmManifest = z.object({
  startCommand: z.string().min(1),
  port: z.number().int().positive(),
})
export type HelmManifest = z.infer<typeof HelmManifest>

/** A live child process under management. `onExit` fires when it dies for any reason. */
export interface SpawnedServer {
  pid: number
  url: string
  kill: () => void
  onExit: (cb: () => void) => void
}

export interface DevServerDeps {
  /** Launch the dev server for a manifest in `cwd`; resolve once the process exists. */
  spawnServer: (cwd: string, manifest: HelmManifest) => SpawnedServer
  /** Poll `url` until it answers (HTTP 2xx/3xx) or `timeoutMs` elapses. */
  probe: (url: string, timeoutMs: number) => Promise<boolean>
  /** Read+validate `helm.json` from `artifactDir`; null if missing/invalid. */
  readManifest: (artifactDir: string) => HelmManifest | null
  /** Is a stored PID still a live process? */
  pidAlive: (pid: number) => boolean
}

type OnStateChange = (projectId: string, state: PreviewState) => void

const PROBE_TIMEOUT_MS = 30_000

/** Default, real process control. Tests pass their own. */
export function defaultDeps(): DevServerDeps {
  return {
    readManifest: (artifactDir) => {
      try {
        const raw = readFileSync(join(artifactDir, 'helm.json'), 'utf8')
        const parsed = HelmManifest.safeParse(JSON.parse(raw))
        return parsed.success ? parsed.data : null
      } catch {
        return null
      }
    },
    spawnServer: (cwd, manifest) => {
      // The start command is the agent's declared `npm run dev`-style command.
      const child = spawn(manifest.startCommand, { cwd, shell: true, stdio: 'ignore' })
      const url = `http://localhost:${manifest.port}`
      return {
        pid: child.pid ?? -1,
        url,
        kill: () => {
          try {
            child.kill()
          } catch {
            /* best effort */
          }
        },
        onExit: (cb) => child.on('exit', cb),
      }
    },
    probe: async (url, timeoutMs) => {
      const deadline = Date.now() + timeoutMs
      while (Date.now() < deadline) {
        const ok = await new Promise<boolean>((resolve) => {
          const req = httpGet(url, (res) => {
            res.resume()
            const code = res.statusCode ?? 0
            resolve(code >= 200 && code < 400)
          })
          req.on('error', () => resolve(false))
          req.setTimeout(2000, () => {
            req.destroy()
            resolve(false)
          })
        })
        if (ok) return true
        await new Promise((r) => setTimeout(r, 400))
      }
      return false
    },
    pidAlive: (pid) => {
      try {
        process.kill(pid, 0)
        return true
      } catch {
        return false
      }
    },
  }
}

export class DevServerManager {
  private servers = new Map<string, SpawnedServer>()
  private states = new Map<string, PreviewState>()
  /** Projects whose server we are killing on purpose — their exit is not a crash. */
  private stopping = new Set<string>()
  /** Auto-recovery attempts since the last clean (re)build. >0 means a second crash blocks. */
  private crashes = new Map<string, number>()

  constructor(
    private db: Db,
    private onStateChange: OnStateChange,
    private deps: DevServerDeps = defaultDeps(),
    /** Base dir under which each project's working directory is created. */
    private artifactRoot: string = join(tmpdir(), 'helm-projects'),
  ) {}

  /**
   * Resolve (creating + persisting on first use) the project's working dir.
   * This is the only place a project's on-disk path is decided. The path is
   * internal — it is never surfaced to the user.
   */
  ensureArtifactDir(projectId: string): string {
    const existing = getArtifactDir(this.db, projectId)
    if (existing) return existing
    const dir = join(this.artifactRoot, projectId)
    mkdirSync(dir, { recursive: true })
    setArtifactDir(this.db, projectId, dir)
    return dir
  }

  private setState(projectId: string, state: PreviewState): void {
    this.states.set(projectId, state)
    this.onStateChange(projectId, state)
  }

  getState(projectId: string): PreviewState {
    return this.states.get(projectId) ?? { status: 'none' }
  }

  /** The orchestrator marks a project as building when a real session starts. */
  markBuilding(projectId: string): void {
    this.setState(projectId, { status: 'building' })
  }

  /** Start (or report already-running) the dev server. Resolves to the live URL. */
  async start(projectId: string): Promise<string> {
    const existing = this.servers.get(projectId)
    if (existing) throw new AlreadyRunningError(existing.url)

    const dir = getArtifactDir(this.db, projectId) // throws NotFoundError if project gone
    if (!dir) throw new NoArtifactError()
    const manifest = this.deps.readManifest(dir)
    if (!manifest) throw new NoArtifactError()

    const server = this.deps.spawnServer(dir, manifest)
    this.servers.set(projectId, server)
    setDevPid(this.db, projectId, server.pid)
    server.onExit(() => this.onUnexpectedExit(projectId))

    const ok = await this.deps.probe(server.url, PROBE_TIMEOUT_MS)
    if (!ok) {
      this.discard(projectId)
      throw new StartFailedError('dev server did not respond in time')
    }
    this.setState(projectId, { status: 'live', url: server.url })
    return server.url
  }

  /** Stop the dev server cleanly. Preview returns to `none`. */
  stop(projectId: string): void {
    this.discard(projectId)
    this.setState(projectId, { status: 'none' })
  }

  /** A fresh build finished — bring the server up to live. One retry, else blocked. */
  async restart(projectId: string): Promise<string> {
    this.crashes.set(projectId, 0)
    this.discard(projectId)
    try {
      return await this.start(projectId)
    } catch (first) {
      try {
        return await this.start(projectId)
      } catch {
        this.setState(projectId, { status: 'blocked' })
        throw first
      }
    }
  }

  /** The server crashed (or a build failed). Show a snag and auto-recover once; a
   *  second crash before a clean rebuild goes to blocked. */
  async handleCrash(projectId: string): Promise<void> {
    const attempts = this.crashes.get(projectId) ?? 0
    this.discard(projectId)
    if (attempts >= 1) {
      this.setState(projectId, { status: 'blocked' })
      return
    }
    this.crashes.set(projectId, attempts + 1)
    this.setState(projectId, { status: 'snag' })
    try {
      await this.start(projectId)
    } catch {
      this.setState(projectId, { status: 'blocked' })
    }
  }

  /** Is the project's stored dev server still a live process? */
  isRunning(projectId: string): boolean {
    const server = this.servers.get(projectId)
    if (server) return this.deps.pidAlive(server.pid)
    // No in-memory handle (e.g. after an app relaunch) — fall back to the stored PID.
    const row = this.db.prepare(`SELECT dev_pid FROM projects WHERE id = ?`).get(projectId) as
      | { dev_pid: number | null }
      | undefined
    const pid = row?.dev_pid ?? null
    return pid != null && this.deps.pidAlive(pid)
  }

  /** Kill + forget a project's server without emitting a state (internal helper). */
  private discard(projectId: string): void {
    const server = this.servers.get(projectId)
    if (server) {
      this.stopping.add(projectId)
      server.kill()
      this.servers.delete(projectId)
    }
    setDevPid(this.db, projectId, null)
  }

  /** The child exited on its own. If we didn't ask for it, it's a crash. */
  private onUnexpectedExit(projectId: string): void {
    if (this.stopping.delete(projectId)) return // we killed it deliberately
    this.servers.delete(projectId)
    setDevPid(this.db, projectId, null)
    void this.handleCrash(projectId)
  }
}
