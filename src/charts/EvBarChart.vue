<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { GroupedBar, StackedBar } from '@unovis/ts'
import { VisAxis, VisGroupedBar, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { BarChartType } from './types'

defineOptions({
  name: 'EvBarChart',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    data: T[]
    /** Key holding each row's category - the X axis. */
    category: keyof T & string
    /** One key per series. Several keys give the board's GroupBarChart. */
    series: (keyof T & string)[]
    /** `stacked` stacks the series within one column instead of clustering. */
    type?: BarChartType
    height?: number
    /** Figma's `Has Value`: the figure above each bar. */
    showValues?: boolean
    /** Names used in the tooltip. Falls back to the series keys. */
    seriesLabels?: string[]
    xLabel?: string
    yLabel?: string
    /** Accessible description of what the chart shows. */
    label?: string
  }>(),
  {
    type: 'grouped',
    height: 240,
    showValues: false,
    seriesLabels: undefined,
    xLabel: undefined,
    yLabel: undefined,
    label: undefined,
  },
)

/** Unovis addresses rows by index, not by key. */
const x = (_d: T, i: number) => i
const y = computed(() => props.series.map((key) => (d: T) => Number(d[key] ?? 0)))

const categoryAt = (i: number) => String(props.data[i]?.[props.category] ?? '')
const labelFor = (i: number) => props.seriesLabels?.[i] ?? props.series[i] ?? ''

const barLabel = computed(() =>
  props.showValues ? (d: T) => String(d[props.series[0] ?? ''] ?? '') : undefined,
)

function tooltipFor(d: T) {
  const rows = props.series.map((key, i) => `${labelFor(i)}: ${String(d[key] ?? '')}`).join('<br/>')
  return `<strong>${String(d[props.category] ?? '')}</strong><br/>${rows}`
}

/**
 * Unovis keys its tooltips by the selector of the element being hovered, so
 * the trigger has to match whichever bar component is rendered.
 */
const triggers = computed(() => ({
  [props.type === 'stacked' ? StackedBar.selectors.bar : GroupedBar.selectors.bar]: tooltipFor,
}))
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-bar-chart"
    :class="`ev-bar-chart--${type}`"
    role="img"
    :aria-label="label"
  >
    <VisXYContainer :data="data" :height="height">
      <VisStackedBar v-if="type === 'stacked'" :x="x" :y="y" :bar-label="barLabel" />
      <VisGroupedBar v-else :x="x" :y="y" :bar-label="barLabel" />

      <VisAxis type="x" :tick-format="categoryAt" :label="xLabel" />
      <VisAxis type="y" :label="yLabel" />
      <VisTooltip :triggers="triggers" />
    </VisXYContainer>
  </div>
</template>

<style lang="scss">
@use './unovis-bridge' as bridge;

/*
 * Wraps Unovis to the `BarChart` component set in Figma (Basic, GroupBarChart,
 * StackedBar).
 *
 * `Basic` is not a separate mode - it is a grouped chart with one series, which
 * is exactly what the board draws. Passing a single key to `series` gives it.
 */
.ev-bar-chart {
  @include bridge.unovis-tokens;

  width: 100%;
}
</style>
