import type { App, Component, Plugin } from 'vue'
import * as atoms from './atoms'
import * as molecules from './molecules'
import * as organisms from './organisms'
import * as patterns from './patterns'
import './styles/index.scss'

/*
 * Components are organised by atomic level - see AGENTS.md "Atomic layers".
 * The level is a source-tree concern only: every component is exported flat
 * from the package root, so `import { EvButton } from 'evoq-ui'` is unchanged.
 */
export * from './atoms'
export * from './molecules'
export * from './organisms'
export * from './patterns'
export type * from './types'

const components = { ...atoms, ...molecules, ...organisms, ...patterns }

/**
 * Registers every Evoq component globally.
 *
 * ```ts
 * import { createApp } from 'vue'
 * import EvoqUI from 'evoq-ui'
 * import 'evoq-ui/style.css'
 *
 * createApp(App).use(EvoqUI).mount('#app')
 * ```
 *
 * Prefer importing components individually when bundle size matters - the
 * package is tree-shakeable.
 */
export const EvoqUI: Plugin = {
  install(app: App) {
    for (const [name, component] of Object.entries(components)) {
      app.component(name, component as Component)
    }
  },
}

export default EvoqUI
