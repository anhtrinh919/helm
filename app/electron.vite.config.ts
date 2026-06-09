import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Hybrid runtime: the shell builds `main` (which starts the core) and `renderer`
 * (served by the core). There is no `preload` — the renderer reaches the core over
 * the HTTP/WebSocket `helm` bridge, identically in the browser and the shell.
 */
export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    base: './',
    resolve: { alias: { '@shared': resolve('src/shared') } },
    plugins: [react(), tailwindcss()],
  },
})
