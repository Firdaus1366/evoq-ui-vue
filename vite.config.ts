import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  server: {
    allowedHosts: ['evoq-ui.crml.my.id'],
  },
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      include: ['src', 'env.d.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Library mode: `index.html` at the repo root is only used by `npm run dev`.
    lib: {
      /*
       * Two entries. Charts are separate so that importing `evoq-ui` never
       * pulls Unovis into a consumer's bundle - only `evoq-ui/charts` does.
       */
      entry: {
        'evoq-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        charts: fileURLToPath(new URL('./src/charts/index.ts', import.meta.url)),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // Never bundle Vue, and never bundle the optional chart engine.
      external: ['vue', '@unovis/vue', '@unovis/ts'],
      output: {
        globals: { vue: 'Vue' },
        assetFileNames: (asset) => {
          const name = asset.name ?? asset.names?.[0] ?? ''
          // The stylesheet keeps its published name; fonts go in a folder.
          return name.endsWith('.css') ? 'evoq-ui.css' : 'fonts/[name][extname]'
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // The playground's simulator is tested too - it is what proves the
    // generated props catalogue actually mounts every component.
    include: [
      'src/**/*.{test,spec}.ts',
      'playground/**/*.{test,spec}.ts',
      // The MCP server, driven over stdio like a real client.
      'scripts/**/*.{test,spec}.ts',
    ],
    // Stubs the SVG layout API jsdom lacks - see the file for why.
    setupFiles: ['./vitest.setup.ts'],
  },
})
