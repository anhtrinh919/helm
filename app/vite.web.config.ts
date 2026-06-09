import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Browser UI dev server for the localhost dogfood (`npm run web`, alongside
 * `npm run core`). The UI talks to the real local core: `/helm` (HTTP) and `/ws`
 * (WebSocket) are proxied to the core on port 4317, so the browser sees one
 * same-origin surface. Append `?mock` in the URL for the offline in-memory mock.
 */
const CORE_PORT = Number(process.env.HELM_PORT ?? 4317)

export default defineConfig({
  root: resolve('src/renderer'),
  resolve: { alias: { '@shared': resolve('src/shared') } },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/helm': { target: `http://127.0.0.1:${CORE_PORT}`, changeOrigin: true },
      '/ws': { target: `ws://127.0.0.1:${CORE_PORT}`, ws: true },
    },
  },
})
