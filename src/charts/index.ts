/**
 * Chart components, published as a separate entry point.
 *
 * ```ts
 * import { EvBarChart } from 'evoq-ui/charts'
 * ```
 *
 * They are not re-exported from the package root on purpose: they depend on
 * Unovis, and importing them from `evoq-ui` would pull that dependency into
 * every consumer's bundle whether or not they draw a chart. Unovis is declared
 * as an *optional* peer dependency, so installing `evoq-ui` alone does not
 * install it - `npm i @unovis/vue @unovis/ts` when you want charts.
 *
 * Theming needs no setup: the components map the EVOQ tokens onto Unovis's own
 * CSS variables, so a chart follows `data-ev-theme` and `data-ev-brand` on its
 * own. The stylesheet is the same one the rest of the library uses.
 */
export { default as EvBarChart } from './EvBarChart.vue'
export { default as EvLineChart } from './EvLineChart.vue'
export { default as EvPieChart } from './EvPieChart.vue'

export type * from './types'
