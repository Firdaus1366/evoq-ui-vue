<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import { CAROUSEL_KEY } from './context'

defineOptions({
  name: 'EvCarouselSlide',
  inheritAttrs: false,
})

defineSlots<{
  default?: () => unknown
}>()

const carousel = inject(CAROUSEL_KEY, null)
const id = Symbol('EvCarouselSlide')

onMounted(() => carousel?.register(id))
onBeforeUnmount(() => carousel?.unregister(id))

const index = computed(() => carousel?.indexOf(id) ?? 0)
const isActive = computed(() => carousel?.active.value === index.value)

/** CSS wants `16 / 9`; the design system writes `16:9`. */
const cssRatio = computed(() => String(carousel?.ratio.value ?? '16:9').replace(':', ' / '))
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-carousel-slide"
    :style="{ aspectRatio: cssRatio }"
    role="group"
    :aria-roledescription="'slide'"
    :aria-hidden="!isActive ? 'true' : undefined"
  >
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * One slot in the carousel track. The board wraps each in the Aspect Ratio
 * component, so the surface and radius here match that component exactly - the
 * ratio itself comes from the parent, which is what keeps a carousel to one
 * ratio throughout.
 */
.ev-carousel-slide {
  box-sizing: border-box;
  flex: 0 0 100%;
  border-radius: var(--ev-radius-md);
  background-color: var(--ev-bg-secondary);
  overflow: hidden;
  scroll-snap-align: start;

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
