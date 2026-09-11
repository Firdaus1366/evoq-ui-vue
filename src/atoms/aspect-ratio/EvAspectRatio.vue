<script setup lang="ts">
import { computed } from 'vue'
import type { AspectRatio } from '../../types'

defineOptions({
  name: 'EvAspectRatio',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** One of the ratios drawn in Figma, or any `w:h` / `w/h` pair. */
    ratio?: AspectRatio | string
  }>(),
  {
    ratio: '16:9',
  },
)

defineSlots<{
  default?: () => unknown
}>()

/** CSS wants `16 / 9`; the design system writes `16:9`. */
const cssRatio = computed(() => props.ratio.replace(':', ' / '))
</script>

<template>
  <div v-bind="$attrs" class="ev-aspect-ratio" :style="{ aspectRatio: cssRatio }">
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Aspect Ratio` component set in Figma (5 ratios). Every
 * variant is the same frame - only the ratio changes - so the ratio is applied
 * inline rather than as five modifier classes, which also lets a consumer pass
 * a ratio the design system has not drawn.
 */
.ev-aspect-ratio {
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--ev-radius-md);
  background-color: var(--ev-bg-secondary);

  /* Media dropped into the slot should fill the box, not overflow it. */
  > img,
  > video,
  > iframe {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
