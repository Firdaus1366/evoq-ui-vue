import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Builds `index.html` + the playground, which the library config never does -
 * `vite.config.ts` runs in library mode and only ever sees `src/index.ts`.
 *
 * Without this, a playground that fails to render still "builds" clean.
 */
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist-playground' },
})
