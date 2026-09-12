<script setup lang="ts">
import { computed, provide } from 'vue'
import { DATA_TABLE_KEY } from './context'
import type { DataTableVariant } from '../../types'

defineOptions({
  name: 'EvDataTable',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** `Variant` of the Figma `Data Table` set. */
    variant?: DataTableVariant
    /** The caption above the table. */
    title?: string
    /** Accessible name, when there is no visible title. */
    label?: string
  }>(),
  {
    variant: 'default',
    title: undefined,
    label: undefined,
  },
)

const slots = defineSlots<{
  /** The `thead` rows - `EvDataTableRow header`. */
  head?: () => unknown
  /** The `tbody` rows. */
  default?: () => unknown
  /** Figma's `Frame 3`: the controls beside the title. */
  actions?: () => unknown
  /** Figma's `Filter` row: the applied-filter Tags and a clear link. */
  filters?: () => unknown
  /** Figma's `Pagination` instance under the table. */
  pagination?: () => unknown
}>()

/**
 * Left Fixed and Right Fixed are the Default table with one column pinned -
 * the board drops the outer border on those two and shifts it onto the
 * scroller. They keep the Default fills, which is what the cells read.
 */
const fill = computed<DataTableVariant>(() =>
  props.variant === 'left-fixed' || props.variant === 'right-fixed' ? 'default' : props.variant,
)

provide(DATA_TABLE_KEY, { variant: fill })

const framed = computed(() => props.variant !== 'left-fixed' && props.variant !== 'right-fixed')
</script>

<template>
  <div v-bind="$attrs" class="ev-data-table" :class="`ev-data-table--${variant}`">
    <div v-if="props.title || slots.actions" class="ev-data-table__header">
      <p v-if="props.title" class="ev-data-table__title">{{ props.title }}</p>
      <div v-if="slots.actions" class="ev-data-table__actions"><slot name="actions" /></div>
    </div>

    <div v-if="slots.filters" class="ev-data-table__filters"><slot name="filters" /></div>

    <div class="ev-data-table__list" :class="{ 'ev-data-table__list--framed': framed }">
      <table class="ev-data-table__table" :aria-label="label">
        <thead v-if="slots.head" class="ev-data-table__head">
          <slot name="head" />
        </thead>
        <tbody class="ev-data-table__body">
          <slot />
        </tbody>
      </table>
    </div>

    <div v-if="slots.pagination" class="ev-data-table__pagination">
      <slot name="pagination" />
    </div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Data Table` component set in Figma (5 Variants), and from
 * `.Table Title`, which supplies the header row's three fills.
 *
 * Node tree, in board order:
 *   Data Table     VERTICAL, gap 8
 *     Frame 4      HORIZONTAL, gap 16 - the "Table Title" label and Frame 3
 *     Filter       HORIZONTAL, gap 8 - Tag instances and a ButtonLink
 *     Table List   VERTICAL, radius 8, a 1px border/primary border
 *       .Table Title  the header row
 *       .Table Row    the body rows
 *     Scroll       2 tall
 *     Pagination   one Pagination instance
 *
 * The header row's fill is the whole of the Variant property:
 *   Default    bg/secondary, border/primary rules, labels grey/700
 *   Secondary  brand/primary-subtle, border/secondary rules, labels brand
 *   No Fill    no fill, border/primary rules, labels text/secondary, and
 *              32-tall body rows with no left rules between cells
 *
 * Left Fixed and Right Fixed keep the Default fills and drop the frame's
 * border, because the pinned column has to cast the table shadow over the
 * scrolling one. Pinning is `position: sticky` on the cell, which is what
 * `EvDataTableCell`'s `fixed` prop sets - the board draws it as a second,
 * overlapping copy of the Table List, which is a Figma technique, not a
 * layout.
 *
 * Everything the Filter row and the header put on screen is an instance on
 * the board - Tag, ButtonLink, Pagination - so all three are slots.
 */
.ev-data-table {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-sm);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-lg);
    min-height: 44px;
  }

  &__title {
    flex: 1 1 auto;
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('body/regular');
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    min-height: 24px;
  }

  &__list {
    overflow-x: auto;
    border-radius: var(--ev-radius-sm);

    &--framed {
      border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    }
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
  }

  /* .Table Title, Variant=Default. */
  &__head .ev-data-table__row {
    background-color: var(--ev-bg-secondary);
    border-top: var(--ev-stroke-xs) solid var(--ev-border-primary);
  }

  &--secondary &__head .ev-data-table__row {
    --ev-data-table-title-fg: var(--ev-brand-primary);

    background-color: var(--ev-brand-primary-subtle);
    border-top-color: var(--ev-border-secondary);
    border-bottom-color: var(--ev-border-secondary);
  }

  &--secondary &__head .ev-data-table__cell {
    border-left-color: var(--ev-border-secondary);
  }

  &--no-fill &__head .ev-data-table__row {
    --ev-data-table-title-fg: var(--ev-text-secondary);

    background-color: transparent;
  }

  &--no-fill &__body .ev-data-table__row {
    background-color: transparent;
  }

  &__pagination {
    display: flex;
    min-height: 32px;
  }
}
</style>
