<script setup lang="ts">
import { computed } from 'vue'
import type { LoadingType } from '../../types'

defineOptions({
  name: 'EvLoading',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** `Type` of the Figma `Loading` set. */
    type?: LoadingType
    /**
     * Progress from 0 to 100. Leave it unset and the progress bar runs
     * indeterminate, which is what the board's animation frames draw.
     */
    value?: number
    /** Announced to assistive tech while the indicator is on screen. */
    label?: string
  }>(),
  {
    type: 'spinner',
    value: undefined,
    label: 'Memuat...',
  },
)

const determinate = computed(() => typeof props.value === 'number')
const clamped = computed(() => Math.min(100, Math.max(0, props.value ?? 0)))
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-loading"
    :class="`ev-loading--${type}`"
    role="status"
    :aria-label="label"
    :aria-valuenow="type === 'progress-bar' && determinate ? clamped : undefined"
    :aria-valuemin="type === 'progress-bar' && determinate ? 0 : undefined"
    :aria-valuemax="type === 'progress-bar' && determinate ? 100 : undefined"
  >
    <!-- Three concentric half-rings; the middle one turns the other way. -->
    <svg
      v-if="type === 'spinner'"
      class="ev-loading__spinner"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle class="ev-loading__arc ev-loading__arc--outer" cx="24" cy="24" r="19" />
      <circle class="ev-loading__arc ev-loading__arc--middle" cx="24" cy="24" r="12" />
      <circle class="ev-loading__arc ev-loading__arc--inner" cx="24" cy="24" r="4" />
    </svg>

    <!-- Four 8px dots on the compass points, painted bottom-up as the board stacks them. -->
    <svg
      v-else-if="type === 'pulse'"
      class="ev-loading__pulse"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <circle class="ev-loading__dot ev-loading__dot--top" cx="24" cy="14" r="4" />
      <circle class="ev-loading__dot ev-loading__dot--bottom" cx="24" cy="34" r="4" />
      <circle class="ev-loading__dot ev-loading__dot--left" cx="14" cy="24" r="4" />
      <circle class="ev-loading__dot ev-loading__dot--right" cx="34" cy="24" r="4" />
    </svg>

    <div v-else-if="type === 'progress-bar'" class="ev-loading__track">
      <div
        class="ev-loading__value"
        :class="{ 'ev-loading__value--indeterminate': !determinate }"
        :style="determinate ? { width: `${clamped}%` } : undefined"
      />
    </div>

    <span class="ev-loading__sr">{{ label }}</span>
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Loading` set (Type: Spinner / Pulse / Progress Bar /
 * Skeleton) and the five `./… Animation` sets that hold its frames.
 *
 * Node tree, in board order:
 *   Type=Spinner       48x48, Ellipse 44 (42, #dbdfe9) / 45 (28, #1b84ff) /
 *                      46 (12, #dbdfe9), each a half arc, stroke 4 round
 *   Type=Pulse         48x48, dots 4/3/2/1 - 8px at N, S, W, E; W and E brand
 *   Type=Progress Bar  262x4, bar #dbdfe9 over value #1b84ff, radius 9999
 *   Type=Skeleton      262x40, #ebedf1, radius 10
 *
 * The animation sets are keyframes, not variants: Spinner steps the rings
 * through 90deg (outer and inner one way, middle the other), Pulse grows one
 * dot at a time behind a fading 24px ghost, Progress Bar slides `value` in
 * from -100%, and Skeleton sweeps a linear gradient across the block. They
 * are CSS animations here rather than four static DOM states.
 *
 * The skeleton radius of 10 is off the radius scale (8 then 12) and is
 * asserted as a literal.
 */
.ev-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* ------------------------------------------------------------- spinner */
  &__spinner {
    width: 48px;
    height: 48px;
  }

  &__arc {
    fill: none;
    stroke-width: 4;
    stroke-linecap: round;
    /* pathLength is unset, so half the ring is exactly half its circumference. */
    stroke-dasharray: 50% 50%;
    transform-origin: 50% 50%;
    animation: ev-loading-spin 1.2s linear infinite;

    &--outer {
      stroke: var(--ev-border-primary);
    }

    &--middle {
      stroke: var(--ev-brand-primary);
      animation-direction: reverse;
    }

    &--inner {
      stroke: var(--ev-border-primary);
    }
  }

  /* --------------------------------------------------------------- pulse */
  &__pulse {
    width: 48px;
    height: 48px;
  }

  &__dot {
    transform-origin: 50% 50%;
    transform-box: fill-box;
    animation: ev-loading-pulse 1.2s ease-in-out infinite;
    fill: var(--ev-border-primary);

    &--left,
    &--right {
      fill: var(--ev-brand-primary);
    }

    /* The board pulses one dot per frame, clockwise from the east point. */
    &--right {
      animation-delay: 0ms;
    }

    &--bottom {
      animation-delay: 300ms;
    }

    &--left {
      animation-delay: 600ms;
    }

    &--top {
      animation-delay: 900ms;
    }
  }

  /* -------------------------------------------------------- progress bar */
  &--progress-bar {
    display: block;
    width: 100%;
  }

  &__track {
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 4px;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-border-primary);
  }

  &__value {
    height: 100%;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-brand-primary);
    transition: width var(--ev-duration-base) var(--ev-easing-standard);

    &--indeterminate {
      width: 100%;
      animation: ev-loading-slide 1.4s var(--ev-easing-standard) infinite;
    }
  }

  /* ------------------------------------------------------------ skeleton */
  &--skeleton {
    position: relative;
    display: block;
    overflow: hidden;
    width: 100%;
    height: 40px;
    /* Off the radius scale - the board draws 10, between `sm` and `md`. */
    border-radius: 10px;
    background-color: var(--ev-bg-subtle);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgb(255 255 255 / 0.45) 50%,
        transparent 100%
      );
      animation: ev-loading-sweep 1.4s linear infinite;
    }
  }
}

@keyframes ev-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ev-loading-pulse {
  0%,
  70%,
  100% {
    transform: scale(1);
  }

  35% {
    transform: scale(1.5);
  }
}

@keyframes ev-loading-slide {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@keyframes ev-loading-sweep {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ev-loading {
    &__arc,
    &__dot,
    &__value--indeterminate,
    &--skeleton::after {
      animation: none;
    }
  }
}
</style>
