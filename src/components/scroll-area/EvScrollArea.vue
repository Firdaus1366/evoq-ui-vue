<script setup lang="ts">
import type { ScrollOrientation } from '../../types'

defineOptions({
  name: 'EvScrollArea',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Which axis may scroll. */
    orientation?: ScrollOrientation
    /** Flips the scrollbar to the opposite edge (e.g. left side for vertical). */
    mirror?: boolean
  }>(),
  {
    orientation: 'vertical',
    mirror: false,
  },
)

defineSlots<{
  default?: () => unknown
}>()
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-scroll-area"
    :class="[`ev-scroll-area--${orientation}`, { 'ev-scroll-area--mirror': mirror }]"
  >
    <div v-if="mirror" class="ev-scroll-area__content">
      <slot />
    </div>
    <slot v-else />
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Scroll` component set in Figma (Type x Mirror).
 *
 * The board draws a 2px thumb in `border/tertiary` over a track that is fully
 * transparent - so this styles the browser's own scrollbar rather than
 * rendering one, which keeps native scrolling, momentum and keyboard support.
 *
 * `Mirror` positions the bar on the opposite edge (e.g. for RTL or mirrored bars).
 */
.ev-scroll-area {
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: var(--ev-border-tertiary) transparent;

  &--mirror {
    direction: rtl;

    > .ev-scroll-area__content {
      direction: ltr;
    }
  }

  &--vertical {
    overflow-x: hidden;
    overflow-y: auto;
  }

  &--horizontal {
    overflow-x: auto;
    overflow-y: hidden;
  }

  &--both {
    overflow: auto;
  }

  /* WebKit and Blink */
  &::-webkit-scrollbar {
    width: var(--ev-stroke-sm);
    height: var(--ev-stroke-sm);
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-border-tertiary);
  }

  &::-webkit-scrollbar-corner {
    background-color: transparent;
  }
}
</style>
