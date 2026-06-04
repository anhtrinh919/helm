import { describe, expect, it, beforeEach } from 'vitest'
import type { PreviewState } from '../../../shared/ipc-schemas'
import { openDatabase, type Db } from '../../db/connection'
import { createProject, setArtifactDir, setDevPid, getDevPid } from '../../db/projects'
import { AlreadyRunningError, NoArtifactError, StartFailedError } from '../../db/errors'
import {
  DevServerManager,
  type DevServerDeps,
  type HelmManifest,
  type SpawnedServer,
} from '../dev-server-manager'
import { clearAllDevPids, resumeDevServers } from '../preview-resume'

/** A controllable fake of the process world. */
function fakeDeps(opts?: { probeOk?: () => boolean; hasManifest?: boolean; alivePids?: Set<number> }) {
  const probeOk = opts?.probeOk ?? (() => true)
  const hasManifest = opts?.hasManifest ?? true
  const alivePids = opts?.alivePids ?? new Set<number>()
  let pidSeq = 1000
  const spawned: { server: SpawnedServer; fireExit: () => void }[] = []

  const deps: DevServerDeps = {
    readManifest: (_dir): HelmManifest | null => (hasManifest ? { startCommand: 'npm run dev', port: 3000 } : null),
    spawnServer: (_cwd, manifest): SpawnedServer => {
      const pid = ++pidSeq
      alivePids.add(pid)
      let exitCb: (() => void) | null = null
      const server: SpawnedServer = {
        pid,
        url: `http://localhost:${manifest.port}`,
        kill: () => alivePids.delete(pid),
        onExit: (cb) => {
          exitCb = cb
        },
      }
      spawned.push({
        server,
        fireExit: () => {
          alivePids.delete(pid)
          exitCb?.()
        },
      })
      return server
    },
    probe: async () => probeOk(),
    pidAlive: (pid) => alivePids.has(pid),
  }
  return { deps, spawned, alivePids }
}

let db: Db
beforeEach(() => {
  db = openDatabase(':memory:')
})

/** Project with an artifact_dir already set (the common precondition). */
function projectWithArtifact(): string {
  const p = createProject(db, 'P')
  setArtifactDir(db, p.id, '/work/p')
  return p.id
}

function recorder() {
  const states: { projectId: string; state: PreviewState }[] = []
  return { states, onChange: (projectId: string, state: PreviewState) => states.push({ projectId, state }) }
}

describe('DevServerManager', () => {
  it('start brings a project to live and stores the dev pid', async () => {
    const rec = recorder()
    const { deps } = fakeDeps()
    const mgr = new DevServerManager(db, rec.onChange, deps)
    const pid = projectWithArtifact()
    const url = await mgr.start(pid)
    expect(url).toBe('http://localhost:3000')
    expect(mgr.getState(pid)).toEqual({ status: 'live', url })
    expect(getDevPid(db, pid)).not.toBeNull()
    expect(rec.states.at(-1)!.state).toEqual({ status: 'live', url })
  })

  it('start throws no_artifact when the project has no working dir', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps().deps)
    const p = createProject(db, 'NoDir')
    await expect(mgr.start(p.id)).rejects.toBeInstanceOf(NoArtifactError)
  })

  it('start throws no_artifact when helm.json is missing', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps({ hasManifest: false }).deps)
    await expect(mgr.start(projectWithArtifact())).rejects.toBeInstanceOf(NoArtifactError)
  })

  it('start throws start_failed and clears the pid when the server never binds', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps({ probeOk: () => false }).deps)
    const pid = projectWithArtifact()
    await expect(mgr.start(pid)).rejects.toBeInstanceOf(StartFailedError)
    expect(getDevPid(db, pid)).toBeNull()
    expect(mgr.getState(pid).status).toBe('none')
  })

  it('a second start while running throws already_running with the existing url', async () => {
    const mgr = new DevServerManager(db, recorder().onChange, fakeDeps().deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    await expect(mgr.start(pid)).rejects.toMatchObject({ code: 'already_running', url: 'http://localhost:3000' })
    await expect(mgr.start(pid)).rejects.toBeInstanceOf(AlreadyRunningError)
  })

  it('stop kills the server, clears the pid, and returns to none', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps().deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    mgr.stop(pid)
    expect(mgr.getState(pid)).toEqual({ status: 'none' })
    expect(getDevPid(db, pid)).toBeNull()
  })

  it('a crash shows a snag then auto-recovers to live', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps().deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    await mgr.handleCrash(pid)
    const seq = rec.states.filter((s) => s.projectId === pid).map((s) => s.state.status)
    expect(seq).toEqual(['live', 'snag', 'live'])
    expect(mgr.getState(pid).status).toBe('live')
  })

  it('a second crash before a clean rebuild goes to blocked', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps().deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    await mgr.handleCrash(pid) // snag → live
    await mgr.handleCrash(pid) // blocked
    expect(mgr.getState(pid).status).toBe('blocked')
  })

  it('restart resets the crash budget so a later crash can snag again', async () => {
    const rec = recorder()
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps().deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    await mgr.handleCrash(pid) // snag → live (crashes = 1)
    await mgr.restart(pid) // clean rebuild resets crashes
    expect(mgr.getState(pid).status).toBe('live')
    await mgr.handleCrash(pid) // budget reset → snag → live again, not blocked
    expect(mgr.getState(pid).status).toBe('live')
  })

  it('an unexpected child exit is treated as a crash (snag), a deliberate stop is not', async () => {
    const rec = recorder()
    const { deps, spawned } = fakeDeps()
    const mgr = new DevServerManager(db, rec.onChange, deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    spawned[0]!.fireExit() // the process died on its own
    // handleCrash is fired async from the exit callback — let microtasks flush.
    await new Promise((r) => setTimeout(r, 0))
    expect(rec.states.filter((s) => s.projectId === pid).map((s) => s.state.status)).toContain('snag')
  })

  it('resume reconnects to a still-alive server using the manifest URL', async () => {
    const rec = recorder()
    const { deps, alivePids } = fakeDeps()
    const pid = projectWithArtifact()
    // Simulate a prior run that left an alive dev server PID behind.
    setDevPid(db, pid, 5555)
    alivePids.add(5555)
    const mgr = new DevServerManager(db, rec.onChange, deps)
    await mgr.resume(pid)
    expect(mgr.getState(pid)).toEqual({ status: 'live', url: 'http://localhost:3000' })
  })

  it('resume restarts a project whose previous server is dead', async () => {
    const rec = recorder()
    const pid = projectWithArtifact()
    setDevPid(db, pid, 999999) // a dead PID
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps().deps)
    await mgr.resume(pid)
    expect(mgr.getState(pid).status).toBe('live')
  })

  it('resume on a project with no manifest leaves it at none and clears the pid', async () => {
    const rec = recorder()
    const pid = projectWithArtifact()
    setDevPid(db, pid, 4242)
    const mgr = new DevServerManager(db, rec.onChange, fakeDeps({ hasManifest: false }).deps)
    await mgr.resume(pid)
    expect(mgr.getState(pid).status).toBe('none')
    expect(getDevPid(db, pid)).toBeNull()
  })

  it('isRunning reflects PID liveness — alive on resume, dead after death', async () => {
    const { deps, alivePids } = fakeDeps()
    const mgr = new DevServerManager(db, recorder().onChange, deps)
    const pid = projectWithArtifact()
    await mgr.start(pid)
    expect(mgr.isRunning(pid)).toBe(true)

    // Simulate a relaunch: a fresh manager with no in-memory handle but a stored alive PID.
    const storedPid = getDevPid(db, pid)!
    alivePids.add(storedPid)
    const fresh = new DevServerManager(db, recorder().onChange, deps)
    expect(fresh.isRunning(pid)).toBe(true)
    // Stored PID dead → not running.
    setDevPid(db, pid, 999999)
    expect(new DevServerManager(db, recorder().onChange, deps).isRunning(pid)).toBe(false)
  })

  it('resumeDevServers brings every artifact-bearing project back; clearAllDevPids wipes PIDs', async () => {
    const rec = recorder()
    const { deps, alivePids } = fakeDeps()
    const a = projectWithArtifact()
    const b = createProject(db, 'B').id // no artifact → skipped
    setDevPid(db, a, 8888)
    alivePids.add(8888)
    const mgr = new DevServerManager(db, rec.onChange, deps)
    await resumeDevServers(db, mgr)
    expect(mgr.getState(a).status).toBe('live')
    expect(mgr.getState(b).status).toBe('none') // never touched

    clearAllDevPids(db)
    expect(getDevPid(db, a)).toBeNull()
  })
})
