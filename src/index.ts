import type { App, Component, Plugin } from 'vue'
import * as components from './components'
import './styles/index.scss'

export * from './components'
export type * from './types'

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
