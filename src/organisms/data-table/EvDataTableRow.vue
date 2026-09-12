<script setup lang="ts">
defineOptions({
  name: 'EvDataTableRow',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /**
     * Figma's `State=Level 1` .. `Level 5`: how deep the row sits in a tree,
     * which is what picks its fill off the `tree/*` ramp. 0 is `State=Default`.
     */
    level?: 0 | 1 | 2 | 3 | 4 | 5
    /** Figma's `State=Selected`. */
    selected?: boolean
    /** Renders the row inside `thead` and drops the hover fill. */
    header?: boolean
  }>(),
  {
    level: 0,
    selected: false,
    header: false,
  },
)

defineSlots<{
  /** The cells - `EvDataTableCell` instances. */
  default?: () => unknown
}>()
</script>

<template>
  <tr
    v-bind="$attrs"
    class="ev-data-table__row"
    :class="[
      `ev-data-table__row--level-${level}`,
      {
        'ev-data-table__row--selected': selected,
        'ev-data-table__row--header': header,
      },
    ]"
    :aria-selected="!header && selected ? true : undefined"
  >
    <slot />
  </tr>
</template>

<style lang="scss">
/*
 * Traced from the `.Table Row` (8 States) and `.Table Row no Fill` (2 States)
 * component sets.
 *
 * Node tree, in board order:
 *   .Table Row   HORIZONTAL, 40 tall, bg/primary, a 1px border/primary
 *                bottom rule, cells with a 1px left rule
 *   Level 1..5   bg tree/lv2 .. tree/lv6 - lv1 is bg/primary, which is what
 *                State=Default already draws
 *   Hover        bg/secondary
 *   Selected     brand/primary-subtle, and the bottom rule turns brand; the
 *                board draws a top rule too, which is the row above's bottom
 *   .Table Row no Fill  32 tall, no fill, no left rules on its cells
 *
 * The tree levels start at lv2 because lv1 is the resting fill: a row at
 * depth 1 is the Default row, so `level` counts indents, not ramp steps.
 */
.ev-data-table__row {
  background-color: var(--ev-bg-primary);
  border-bottom: var(--ev-stroke-xs) solid var(--ev-border-primary);
  transition: background-color var(--ev-duration-fast) var(--ev-easing-standard);

  &--level-1 {
    background-color: var(--ev-tree-lv2);
  }

  &--level-2 {
    background-color: var(--ev-tree-lv3);
  }

  &--level-3 {
    background-color: var(--ev-tree-lv4);
  }

  &--level-4 {
    background-color: var(--ev-tree-lv5);
  }

  &--level-5 {
    background-color: var(--ev-tree-lv6);
  }

  &:hover:not(.ev-data-table__row--header):not(.ev-data-table__row--selected) {
    background-color: var(--ev-bg-secondary);
  }

  &--selected {
    background-color: var(--ev-brand-primary-subtle);
    border-bottom-color: var(--ev-brand-primary);
  }
}
</style>
