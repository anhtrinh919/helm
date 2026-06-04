/**
 * Group 9 smoke: prove the real preview pipeline end-to-end with REAL process
 * I/O (no fakes, no live Claude SDK). We stand in a minimal full-stack web app
 * (a real Node HTTP server + a helm.json manifest) where a build session would
 * have written one, then drive the DevServerManager exactly as the orchestrator
 * does: read the manifest → spawn the dev server → probe until live → confirm an
 * HTTP GET returns 200 → stop. If this passes, the chain
 * artifact_dir → helm.json → dev server → embeddable URL is sound.
 *
 * Run: npx tsx scripts/verify-group-9.ts   (needs the Node ABI for better-sqlite3)
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { get as httpGet } from 'node:http'
import { openDatabase } from '../src/main/db/connection'
import { createProject, setArtifactDir } from '../src/main/db/projects'
import { DevServerManager, defaultDeps } from '../src/main/sdk/dev-server-manager'
import type { PreviewState } from '../src/shared/ipc-schemas'

const PORT = 4399

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

function httpStatus(url: string): Promise<{ code: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpGet(url, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ code: res.statusCode ?? 0, body }))
    })
    req.on('error', reject)
    req.setTimeout(3000, () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}

async function main(): Promise<void> {
  const work = mkdtempSync(join(tmpdir(), 'helm-g9-'))

  // A minimal real full-stack web app, as a build session would have produced.
  writeFileSync(
    join(work, 'server.js'),
    `const http=require('http');
const s=http.createServer((req,res)=>{
  if(req.url==='/api/ping'){res.writeHead(200,{'content-type':'application/json'});return res.end('{"ok":true}');}
  res.writeHead(200,{'content-type':'text/html'});
  res.end('<!doctype html><h1>Order Up</h1><button id=r onclick="this.textContent=String.fromCharCode(82,101,97,100,121)">Mark ready</button>');
});
s.listen(${PORT},()=>console.log('listening'));`,
  )
  writeFileSync(join(work, 'helm.json'), JSON.stringify({ startCommand: 'node server.js', port: PORT }))

  const db = openDatabase(':memory:')
  const project = createProject(db, 'Smoke')
  setArtifactDir(db, project.id, work)

  const states: PreviewState[] = []
  const mgr = new DevServerManager(db, (_p, s) => states.push(s), defaultDeps(), tmpdir())

  console.log('── starting dev server from helm.json ──')
  const url = await mgr.start(project.id)
  if (url !== `http://localhost:${PORT}`) fail(`unexpected url: ${url}`)
  if (mgr.getState(project.id).status !== 'live') fail('preview did not reach live')
  console.log(`✓ dev server live at ${url}`)

  const home = await httpStatus(url)
  if (home.code !== 200) fail(`GET / returned ${home.code}`)
  if (!home.body.includes('Order Up')) fail('home page missing expected content')
  console.log('✓ GET / → 200 with rendered app')

  const api = await httpStatus(`${url}/api/ping`)
  if (api.code !== 200 || !api.body.includes('ok')) fail(`GET /api/ping returned ${api.code}`)
  console.log('✓ GET /api/ping → 200 (backend responds)')

  mgr.stop(project.id)
  if (mgr.getState(project.id).status !== 'none') fail('stop did not return to none')
  console.log('✓ stop → preview none')

  rmSync(work, { recursive: true, force: true })
  console.log('\n✓ Group 9 smoke passed: artifact → helm.json → dev server → live URL → 200')
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)))
