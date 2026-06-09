import { homedir } from 'node:os'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { startCore } from './index'

/**
 * Headless core entry for the localhost dogfood (`npm run core`). Runs the whole
 * Helm core as a plain Node process — no Electron — on a fixed port so Vite (the
 * web UI dev server) can proxy `/helm` + `/ws` to it. This is the day-to-day
 * dogfood surface; the Electron shell is the packaged distribution form.
 */

const dataDir = process.env.HELM_DATA_DIR ?? join(homedir(), '.helm')
mkdirSync(dataDir, { recursive: true })
const port = Number(process.env.HELM_PORT ?? 4317)

void startCore({ dataDir, port }).then((core) => {
  // eslint-disable-next-line no-console
  console.log(`[helm] core listening on ${core.url} (data: ${dataDir})`)
})
