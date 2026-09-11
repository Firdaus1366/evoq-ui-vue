<script setup lang="ts">
import type { SeparatorOrientation } from '../../types'

defineOptions({
  name: 'EvSeparator',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    orientation?: SeparatorOrientation
    /**
     * Purely decorative rules are hidden from assistive tech. Leave this off
     * when the rule actually separates two groups of content.
     */
    decorative?: boolean
  }>(),
  {
    orientation: 'horizontal',
    decorative: false,
  },
)
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-separator"
    :class="`ev-separator--${orientation}`"
    :role="decorative ? 'none' : 'separator'"
    :aria-orientation="decorative ? undefined : orientation"
  />
</template>

<style lang="scss">
/*
 * Traced from the `Separator` component set in Figma (2 variants). Both are a
 * 1px line in `border/primary`; only the axis changes.
 */
.ev-separator {
  background-color: var(--ev-border-primary);
  border: 0;
  flex-shrink: 0;

  &--horizontal {
    width: 100%;
    height: var(--ev-stroke-xs);
  }

  /*
   * Stretches to the height of a flex row. Outside one it collapses, so a
   * vertical rule needs a height from its container.
   */
  &--vertical {
    width: var(--ev-stroke-xs);
    height: 100%;
    align-self: stretch;
  }
}
</style>
