import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ipcMain } from '../core/transport'
import { ZodError } from 'zod'
import {
  CH,
  ImportScanRequest,
  ImportStartRequest,
  type ImportScanResponse,
  type IpcError,
} from '../../shared/ipc-schemas'
import type { Db } from '../db/connection'
import {
  AlreadyRunningError,
  NotFoundError,
  StartFailedError,
} from '../db/errors'
import { getProject, setArtifactDir, setImportFolder, setProjectMode } from '../db/projects'
import { HelmManifest, type DevServerManager } from '../sdk/dev-server-manager'

/**
 * Phase 4: import an existing AI-built local web app. Scan derives a run
 * manifest (start command + port) from the folder; start writes helm.json,
 * points the project's artifact_dir at the folder, and brings the dev server
 * up through the existing DevServerManager — an imported app is previewed and
 * iterated exactly like a Helm-built one.
 */

function mapError(e: unknown): IpcError {
  if (e instanceof NotFoundError) return { error: 'not_found' }
  if (e instanceof AlreadyRunningError) return { error: 'already_running' }
  if (e instanceof StartFailedError) return { error: 'start_failed', message: e.message }
  if (e instanceof ZodError) {
    const first = e.issues[0]
    return { error: 'validation_failed', field: first?.path.join('.'), message: first?.message }
  }
  return { error: 'scan_failed', message: e instanceof Error ? e.message : 'unknown error' }
}

/** Pull an explicit port out of a dev command ("-p 4000", "--port 4000", "--port=4000"). */
function portFromCommand(cmd: string): number | null {
  const m = /(?:-p|--port)[=\s]+(\d{2,5})/.exec(cmd)
  if (!m) return null
  const port = Number(m[1])
  return port > 0 && port < 65536 ? port : null
}

/** Best-effort manifest derivation. helm.json = high confidence; everything else = low. */
export function scanFolder(folderPath: string): ImportScanResponse {
  // 1 — helm.json: Helm's own manifest convention. Trust it outright.
  try {
    const raw = readFileSync(join(folderPath, 'helm.json'), 'utf8')
    const parsed = HelmManifest.safeParse(JSON.parse(raw))
    if (parsed.success) {
      return {
        found: true,
        startCommand: parsed.data.startCommand,
        port: parsed.data.port,
        confidence: 'high',
      }
    }
  } catch {
    /* keep scanning */
  }

  // 2 — package.json scripts: dev > start > preview.
  try {
    const raw = readFileSync(join(folderPath, 'package.json'), 'utf8')
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    const scripts = pkg.scripts ?? {}
    const name = (['dev', 'start', 'preview'] as const).find((s) => typeof scripts[s] === 'string')
    if (name) {
      const script = scripts[name]!
      const deps = { ...pkg.dependencies, ...pkg.devDependencies }
      const port =
        portFromCommand(script) ??
        (script.includes('vite') || deps['vite'] ? 5173 : null) ??
        (script.includes('next') || deps['next'] ? 3000 : null) ??
        3000
      return { found: true, startCommand: `npm run ${name}`, port, confidence: 'low' }
    }
  } catch {
    /* keep scanning */
  }

  // 3 — bare framework configs without a package.json script.
  const hasAny = (...files: string[]): boolean => files.some((f) => existsSync(join(folderPath, f)))
  if (hasAny('vite.config.ts', 'vite.config.js', 'vite.config.mjs')) {
    return { found: true, startCommand: 'npx vite', port: 5173, confidence: 'low' }
  }
  if (hasAny('next.config.ts', 'next.config.js', 'next.config.mjs')) {
    return { found: true, startCommand: 'npx next dev', port: 3000, confidence: 'low' }
  }
  // 4 — a plain static site is still runnable.
  if (existsSync(join(folderPath, 'index.html'))) {
    return { found: true, startCommand: 'python3 -m http.server 8080', port: 8080, confidence: 'low' }
  }

  return { found: false }
}

export function registerImportBridge(db: Db, devServer: DevServerManager): void {
  ipcMain.handle(CH.importScan, (_e, raw: unknown) => {
    try {
      const { folderPath } = ImportScanRequest.parse(raw)
      if (!existsSync(folderPath) || !statSync(folderPath).isDirectory()) {
        return { error: 'folder_not_found' }
      }
      return scanFolder(folderPath)
    } catch (e) {
      return mapError(e)
    }
  })

  ipcMain.handle(CH.importStart, async (_e, raw: unknown) => {
    try {
      const { projectId, folderPath, startCommand, port } = ImportStartRequest.parse(raw)
      getProject(db, projectId) // not_found guard
      if (!existsSync(folderPath) || !statSync(folderPath).isDirectory()) {
        return { error: 'folder_not_found' }
      }
      // Persist the confirmed manifest as helm.json so every later start
      // (resume, restart after a fix) goes through the one standard path.
      writeFileSync(join(folderPath, 'helm.json'), JSON.stringify({ startCommand, port }))
      setArtifactDir(db, projectId, folderPath)
      setImportFolder(db, projectId, folderPath)
      setProjectMode(db, projectId, 'iterate')
      const url = await devServer.start(projectId)
      return { ok: true as const, url }
    } catch (e) {
      return mapError(e)
    }
  })
}
