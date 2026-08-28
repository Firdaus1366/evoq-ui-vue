<script setup lang="ts">
import { computed, provide, ref, toRef } from 'vue'
import { CAROUSEL_KEY } from './context'
import type { AspectRatio, CarouselOrientation } from '../../types'

defineOptions({
  name: 'EvCarousel',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Index of the slide in view. */
    modelValue?: number
    orientation?: CarouselOrientation
    /**
     * Applied to every slide. The usage doc is explicit that one carousel keeps
     * a single ratio throughout, so it lives here rather than on each slide.
     */
    ratio?: AspectRatio | string
    /** Figma's `Need Button`: the previous/next controls. */
    showButtons?: boolean
    /** Figma's `Has Indicator Slot`: the position dots. */
    showIndicator?: boolean
    previousLabel?: string
    nextLabel?: string
    /** Accessible name for the carousel. */
    label?: string
  }>(),
  {
    modelValue: 0,
    orientation: 'horizontal',
    ratio: '16:9',
    showButtons: true,
    showIndicator: true,
    previousLabel: 'Sebelumnya',
    nextLabel: 'Berikutnya',
    label: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

defineSlots<{
  /** The slides - one `EvCarouselSlide` each. */
  default?: () => unknown
  /** Figma's `Indicator Slot`: replaces the default dot row. */
  indicator?: (props: { count: number; active: number; go: (i: number) => void }) => unknown
}>()

const slides = ref<symbol[]>([])

const count = computed(() => slides.value.length)
const active = computed(() => Math.min(Math.max(props.modelValue, 0), Math.max(count.value - 1, 0)))

provide(CAROUSEL_KEY, {
  orientation: toRef(props, 'orientation'),
  ratio: toRef(props, 'ratio'),
  active,
  register: (id) => {
    if (!slides.value.includes(id)) slides.value = [...slides.value, id]
  },
  unregister: (id) => {
    slides.value = slides.value.filter((s) => s !== id)
  },
  indexOf: (id) => slides.value.indexOf(id),
})

function go(index: number) {
  if (index < 0 || index > count.value - 1) return
  emit('update:modelValue', index)
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-carousel"
    :class="`ev-carousel--${orientation}`"
    role="group"
    :aria-roledescription="'carousel'"
    :aria-label="label"
  >
    <button
      v-if="showButtons"
      type="button"
      class="ev-carousel__button ev-carousel__button--previous"
      :aria-label="previousLabel"
      :disabled="active === 0"
      @click="go(active - 1)"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M10 3.5L5.5 8 10 12.5"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div class="ev-carousel__container">
      <!--
        The track is a scroll container in its own right, so a carousel with
        both the buttons and the indicator hidden can still be reached by
        keyboard and by swipe.
      -->
      <div class="ev-carousel__track" tabindex="0">
        <slot />
      </div>

      <div v-if="showIndicator" class="ev-carousel__indicator">
        <slot name="indicator" :count="count" :active="active" :go="go">
          <button
            v-for="i in count"
            :key="i"
            type="button"
            class="ev-carousel__dot"
            :class="{ 'ev-carousel__dot--active': i - 1 === active }"
            :aria-label="`Slide ${i}`"
            :aria-current="i - 1 === active ? 'true' : undefined"
            @click="go(i - 1)"
          />
        </slot>
      </div>
    </div>

    <button
      v-if="showButtons"
      type="button"
      class="ev-carousel__button ev-carousel__button--next"
      :aria-label="nextLabel"
      :disabled="active >= count - 1"
      @click="go(active + 1)"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M6 3.5L10.5 8 6 12.5"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Carousel` component set in Figma (10 variants: Variant x
 * Aspect Ratio).
 *
 * The usage doc says "Don't hide both the buttons and the indicator at once".
 * Rather than police the props, the track itself is focusable and scrollable,
 * so a carousel configured that way is still navigable instead of being a
 * dead end.
 */
.ev-carousel {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-xs);

  &__container {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    flex: 1;
    min-width: 0;
  }

  &__track {
    display: flex;
    gap: var(--ev-spacing-xs);
    overflow: auto;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  /* The board's control: a pill in the subtle brand tint. */
  &__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid var(--ev-brand-primary-200);
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-brand-primary-subtle);
    color: var(--ev-icon-primary);
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  &__indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1px;
  }

  /* The active dot stretches into a bar rather than changing size. */
  &__dot {
    width: 4px;
    height: 4px;
    padding: 0;
    border: 0;
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-border-tertiary);
    cursor: pointer;
    transition: width var(--ev-duration-fast) var(--ev-easing-standard);

    &--active {
      width: 12px;
      background-color: var(--ev-brand-primary);
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  &--vertical {
    flex-direction: column;

    .ev-carousel__track {
      flex-direction: column;
      scroll-snap-type: y mandatory;
    }
  }
}
</style>
