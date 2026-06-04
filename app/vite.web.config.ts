import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Browser-only renderer server. Runs the UI without Electron (the bridge falls
 * back to an in-memory mock) for visual review and UI dogfooding.
 */
export default defineConfig({
  root: resolve('src/renderer'),
  resolve: { alias: { '@shared': resolve('src/shared') } },
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true },
})
