<script setup lang="ts">
import type { KbdVariant } from '../../types'

defineOptions({
  name: 'EvKbd',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** A text cap hugs its label; an icon cap is a 16px square. */
    variant?: KbdVariant
    /** Figma's `Light` property. Set to false for the dark cap. */
    light?: boolean
  }>(),
  {
    variant: 'text',
    light: true,
  },
)

defineSlots<{
  default?: () => unknown
}>()
</script>

<template>
  <kbd
    v-bind="$attrs"
    class="ev-kbd"
    :class="[`ev-kbd--${variant}`, light ? 'ev-kbd--light' : 'ev-kbd--dark']"
  >
    <slot />
  </kbd>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Kbd` component set in Figma (4 variants: Variant x Light).
 *
 * The dark cap resolves to `neutral/700`, which the semantic layer only names
 * in dark mode. It is exposed through component-level properties so the reach
 * past the semantic layer stays in one place and consumers can re-point it.
 */
.ev-kbd {
  --ev-kbd-bg: var(--ev-bg-subtle);
  --ev-kbd-fg: var(--ev-text-secondary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ev-spacing-2xs);
  height: 16px;
  border-radius: var(--ev-radius-xs);
  background-color: var(--ev-kbd-bg);
  color: var(--ev-kbd-fg);

  @include type.style('body/xtrasmall-b');

  /* The icon cap sits one step lighter than the text cap in the light theme. */
  &--icon {
    --ev-kbd-fg: var(--ev-icon-secondary);
  }

  &--dark {
    --ev-kbd-bg: var(--ev-neutral-700);
    --ev-kbd-fg: var(--ev-text-tertiary);

    &.ev-kbd--icon {
      --ev-kbd-fg: var(--ev-icon-tertiary);
    }
  }

  &--text {
    padding: 0 var(--ev-spacing-2xs);
  }

  /* The icon cap is a square, so its padding is even on all four sides. */
  &--icon {
    width: 16px;
    padding: var(--ev-spacing-2xs);
  }
}
</style>
