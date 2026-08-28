<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import type { LineChartType } from './types'

defineOptions({
  name: 'EvLineChart',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    data: T[]
    /** Key holding each row's position on the X axis. */
    category: keyof T & string
    /** One key per series. */
    series: (keyof T & string)[]
    /** `area` fills the region beneath the trend, as the board's Area does. */
    type?: LineChartType
    height?: number
    /** Names used in the tooltip. Falls back to the series keys. */
    seriesLabels?: string[]
    xLabel?: string
    yLabel?: string
    /** Accessible description of what the chart shows. */
    label?: string
  }>(),
  {
    type: 'line',
    height: 240,
    seriesLabels: undefined,
    xLabel: undefined,
    yLabel: undefined,
    label: undefined,
  },
)

const x = (_d: T, i: number) => i
const y = computed(() => props.series.map((key) => (d: T) => Number(d[key] ?? 0)))

const categoryAt = (i: number) => String(props.data[i]?.[props.category] ?? '')
const labelFor = (i: number) => props.seriesLabels?.[i] ?? props.series[i] ?? ''

/**
 * A crosshair reads the whole row at once, so the tooltip lists every series
 * at that point rather than only the line under the pointer.
 */
function tooltipFor(d: T) {
  const rows = props.series.map((key, i) => `${labelFor(i)}: ${String(d[key] ?? '')}`).join('<br/>')
  return `<strong>${String(d[props.category] ?? '')}</strong><br/>${rows}`
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-line-chart"
    :class="`ev-line-chart--${type}`"
    role="img"
    :aria-label="label"
  >
    <VisXYContainer :data="data" :height="height">
      <!-- The board's Area keeps its line and fills beneath it. -->
      <VisArea v-if="type === 'area'" :x="x" :y="y" :opacity="0.2" />
      <VisLine :x="x" :y="y" />

      <VisAxis type="x" :tick-format="categoryAt" :label="xLabel" />
      <VisAxis type="y" :label="yLabel" />
      <VisCrosshair :template="tooltipFor" />
      <VisTooltip />
    </VisXYContainer>
  </div>
</template>

<style lang="scss">
@use './unovis-bridge' as bridge;

/*
 * Wraps Unovis to the `LineChart` component set in Figma (Line and Area).
 */
.ev-line-chart {
  @include bridge.unovis-tokens;

  width: 100%;
}
</style>
