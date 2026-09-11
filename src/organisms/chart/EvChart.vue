<script setup lang="ts">
import { useId } from 'vue'
import type { ChartVariant } from '../../types'

defineOptions({
  name: 'EvChart',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** `card` wraps the chart in a surface; `no-card` renders it bare. */
    variant?: ChartVariant
    title?: string
    /** Figma's `Has Subtext`: a muted line under the title - a range or unit. */
    subtext?: string
  }>(),
  {
    variant: 'card',
    title: undefined,
    subtext: undefined,
  },
)

defineSlots<{
  /** Figma's `Chart Slot`: the visualisation itself. */
  default?: () => unknown
  title?: () => unknown
  subtext?: () => unknown
  /** Figma's header `Slot`: an action such as a filter or menu. */
  headerAction?: () => unknown
  /** Figma's `Has Summary`: the KPI row above the chart. */
  summary?: () => unknown
  /** The series legend, between the summary and the chart. */
  legend?: () => unknown
}>()

const titleId = `ev-chart-title-${useId()}`
</script>

<template>
  <figure
    v-bind="$attrs"
    class="ev-chart"
    :class="`ev-chart--${variant}`"
    :aria-labelledby="title || $slots.title ? titleId : undefined"
  >
    <figcaption
      v-if="title || subtext || $slots.title || $slots.subtext || $slots.headerAction"
      class="ev-chart__header"
    >
      <div class="ev-chart__information">
        <p :id="titleId" class="ev-chart__title">
          <slot name="title">{{ title }}</slot>
        </p>
        <p v-if="subtext || $slots.subtext" class="ev-chart__subtext">
          <slot name="subtext">{{ subtext }}</slot>
        </p>
      </div>

      <div v-if="$slots.headerAction" class="ev-chart__header-action">
        <slot name="headerAction" />
      </div>
    </figcaption>

    <div class="ev-chart__content">
      <div v-if="$slots.summary" class="ev-chart__summary"><slot name="summary" /></div>
      <div v-if="$slots.legend" class="ev-chart__legend"><slot name="legend" /></div>
      <div class="ev-chart__slot"><slot /></div>
    </div>
  </figure>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Chart` component set in Figma (Card and No Card).
 *
 * WHAT THIS IS NOT: the board also draws Bar, Line and Pie families. Those are
 * data visualisations, not UI chrome - rendering them properly means scales,
 * axes, ticks and layout algorithms, which is a charting library's job rather
 * than a component library's. The board's own doc says the container "accepts
 * any chart component ... swap the chart without rebuilding the container", so
 * that is exactly what this is: the titled surface, the KPI row, the legend
 * rail, and a slot for whichever chart you render into it.
 *
 * DOC MISMATCH: the usage doc calls Card "a bordered surface", but the board
 * draws no border - only a white surface with a radius. The board is followed.
 */
.ev-chart {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-lg);
  margin: 0;

  &--card {
    padding: var(--ev-spacing-xl);
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-bg-primary);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ev-spacing-md);
  }

  &__information {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    min-width: 0;
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('subheading/h5');
  }

  &__subtext {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }

  &__header-action {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* The content column is tighter than the header gap, as the board draws it. */
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
  }

  &__summary {
    display: flex;
    align-items: flex-start;
    gap: var(--ev-spacing-lg);
    flex-wrap: wrap;
  }

  &__legend {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    flex-wrap: wrap;
  }

  &__slot {
    min-width: 0;
  }
}
</style>
