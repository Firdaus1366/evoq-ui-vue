<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import EvAspectRatio from '../../atoms/aspect-ratio/EvAspectRatio.vue'
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
const ratio = computed(() => String(carousel?.ratio.value ?? '16:9'))
</script>

<template>
  <!--
    node: Aspect Ratio - the board wraps every slide in an instance of it, so
    the slide is that atom. The ratio comes from the parent, which is what
    keeps a carousel to one ratio throughout.
  -->
  <EvAspectRatio
    v-bind="$attrs"
    class="ev-carousel-slide"
    :ratio="ratio"
    role="group"
    :aria-roledescription="'slide'"
    :aria-hidden="!isActive ? 'true' : undefined"
  >
    <slot />
  </EvAspectRatio>
</template>

<style lang="scss">
/* Only the slide's place in the track; its surface is the Aspect Ratio atom's. */
.ev-carousel-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
}
</style>
