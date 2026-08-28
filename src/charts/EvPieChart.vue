<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { Donut } from '@unovis/ts'
import { VisDonut, VisSingleContainer, VisTooltip } from '@unovis/vue'
import type { PieChartType } from './types'

defineOptions({
  name: 'EvPieChart',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    data: T[]
    /** Key holding each slice's value. */
    value: keyof T & string
    /** Key holding each slice's name, used by the tooltip. */
    category: keyof T & string
    /**
     * `pie` is a full circle, `doughnut` hollows the centre, and
     * `doughnut-rounded` separates the segments and rounds their ends.
     */
    type?: PieChartType
    height?: number
    /** Text placed in the hollow centre. Ignored by the `pie` type. */
    centralLabel?: string
    centralSubLabel?: string
    /** Accessible description of what the chart shows. */
    label?: string
  }>(),
  {
    type: 'doughnut',
    height: 240,
    centralLabel: undefined,
    centralSubLabel: undefined,
    label: undefined,
  },
)

const value = (d: T) => Number(d[props.value] ?? 0)

/** A pie is a donut whose hole has no width. */
const arcWidth = computed(() => (props.type === 'pie' ? 0 : 48))

/*
 * The board's Doughnut Rounded is a donut with rounded arc ends and a gap
 * between segments - which is exactly `cornerRadius` plus `padAngle`.
 */
const cornerRadius = computed(() => (props.type === 'doughnut-rounded' ? 8 : 0))
const padAngle = computed(() => (props.type === 'doughnut-rounded' ? 0.04 : 0))

function tooltipFor(d: { data: T }) {
  const row = d.data ?? (d as unknown as T)
  return `<strong>${String(row[props.category] ?? '')}</strong><br/>${String(row[props.value] ?? '')}`
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-pie-chart"
    :class="`ev-pie-chart--${type}`"
    role="img"
    :aria-label="label"
  >
    <VisSingleContainer :data="data" :height="height">
      <VisDonut
        :value="value"
        :arc-width="arcWidth"
        :corner-radius="cornerRadius"
        :pad-angle="padAngle"
        :central-label="type === 'pie' ? undefined : centralLabel"
        :central-sub-label="type === 'pie' ? undefined : centralSubLabel"
      />
      <VisTooltip :triggers="{ [Donut.selectors.segment]: tooltipFor }" />
    </VisSingleContainer>
  </div>
</template>

<style lang="scss">
@use './unovis-bridge' as bridge;

/*
 * Wraps Unovis to the `PieChart` component set in Figma (Pie, Doughnut,
 * Doughnut Rounded).
 *
 * The board's five slices are `brand/primary`, `ext/success`, `ext/warning`,
 * `brand/secondary` and `ext/error` in that order - which is the chart series
 * palette, so the bridge already supplies them.
 */
.ev-pie-chart {
  @include bridge.unovis-tokens;

  --vis-donut-central-label-text-color: var(--ev-text-primary);
  --vis-donut-central-sub-label-text-color: var(--ev-text-secondary);

  width: 100%;
}
</style>
