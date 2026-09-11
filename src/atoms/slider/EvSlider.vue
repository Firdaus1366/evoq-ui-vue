<script setup lang="ts">
import { computed } from 'vue'
import type { SliderOrientation, SliderVariant } from '../../types'

defineOptions({
  name: 'EvSlider',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** A single number, or a `[lower, upper]` pair when `range` is on. */
    modelValue?: number | [number, number]
    min?: number
    max?: number
    step?: number
    variant?: SliderVariant
    orientation?: SliderOrientation
    /** Adds the second handle, filling between the two. */
    range?: boolean
    disabled?: boolean
    /** Shows the current value beneath the handle. */
    showValue?: boolean
    /** Accessible name. Required when there is no visible label. */
    label?: string
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    variant: 'primary',
    orientation: 'horizontal',
    range: false,
    disabled: false,
    showValue: false,
    label: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number | [number, number]]
}>()

const pair = computed<[number, number]>(() =>
  Array.isArray(props.modelValue)
    ? [props.modelValue[0], props.modelValue[1]]
    : [props.min, props.modelValue],
)

const percent = (value: number) => {
  const span = props.max - props.min
  if (span <= 0) return 0
  return ((value - props.min) / span) * 100
}

/**
 * The filled portion runs from the start of the track to the handle, or
 * between the two handles in range mode.
 */
const fillStart = computed(() => (props.range ? percent(pair.value[0]) : 0))
const fillEnd = computed(() => percent(pair.value[1]))

const fillStyle = computed(() => {
  const from = `${fillStart.value}%`
  const size = `${fillEnd.value - fillStart.value}%`
  return props.orientation === 'vertical'
    ? { bottom: from, height: size }
    : { left: from, width: size }
})

function emitAt(index: 0 | 1, raw: string) {
  const next = Number(raw)
  if (!props.range) {
    emit('update:modelValue', next)
    return
  }
  const [lower, upper] = pair.value
  // The handles must not cross, so each one clamps against the other.
  const bounded: [number, number] =
    index === 0 ? [Math.min(next, upper), upper] : [lower, Math.max(next, lower)]
  emit('update:modelValue', bounded)
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-slider"
    :class="[
      `ev-slider--${variant}`,
      `ev-slider--${orientation}`,
      { 'ev-slider--range': range, 'ev-slider--disabled': disabled },
    ]"
  >
    <span class="ev-slider__track" aria-hidden="true">
      <span class="ev-slider__fill" :style="fillStyle" />
    </span>

    <!--
      Native range inputs sit invisibly over the painted track, so keyboard
      support, ARIA and form participation come from the platform rather than
      being re-implemented. Range mode stacks two of them.
    -->
    <input
      v-if="range"
      class="ev-slider__input ev-slider__input--lower"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="pair[0]"
      :disabled="disabled"
      :aria-label="label ? `${label} (batas bawah)` : undefined"
      :aria-orientation="orientation"
      @input="emitAt(0, ($event.target as HTMLInputElement).value)"
    />

    <input
      class="ev-slider__input ev-slider__input--upper"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="pair[1]"
      :disabled="disabled"
      :aria-label="range && label ? `${label} (batas atas)` : label"
      :aria-orientation="orientation"
      @input="emitAt(1, ($event.target as HTMLInputElement).value)"
    />

    <span v-if="showValue" class="ev-slider__values" aria-hidden="true">
      <span v-if="range" class="ev-slider__value">{{ pair[0] }}</span>
      <span class="ev-slider__value">{{ pair[1] }}</span>
    </span>
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Slider` component set in Figma (9 variants: Type x Variant)
 * and its `.Bar` and `.Thumb` parts.
 *
 * Figma's `Type` conflates two independent things - Range adds a second handle,
 * Vertical changes the axis - so the set has no vertical range. They are split
 * here into `range` and `orientation`, which reaches every drawn variant and
 * the combination the board could not express.
 *
 * OFF-SYSTEM COLOURS: the board paints the resting track `#64748b40` and the
 * destructive fill `#991515`. Neither is in any EVOQ ramp (`#64748b` is
 * Tailwind's slate-500). They are reproduced as drawn but held in component
 * properties, so the day they are brought into the token system there is one
 * place to change.
 */
.ev-slider {
  --ev-slider-track: #64748b40;
  --ev-slider-fill: var(--ev-text-secondary);
  --ev-slider-thumb-bg: var(--ev-bg-primary);
  --ev-slider-thumb-border: var(--ev-border-primary);
  --ev-slider-thickness: 4px;
  --ev-slider-thumb: 20px;

  position: relative;
  box-sizing: border-box;

  &__track {
    position: absolute;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-slider-track);
  }

  &__fill {
    position: absolute;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-slider-fill);
  }

  /*
   * The input is transparent and stretched over the track; only its thumb is
   * painted. `pointer-events: none` on the track lets the two stacked inputs
   * in range mode both stay grabbable.
   */
  &__input {
    position: absolute;
    margin: 0;
    background: none;
    appearance: none;
    cursor: pointer;

    &::-webkit-slider-thumb {
      appearance: none;
      box-sizing: border-box;
      width: var(--ev-slider-thumb);
      height: var(--ev-slider-thumb);
      border: var(--ev-stroke-sm) solid var(--ev-slider-thumb-border);
      border-radius: var(--ev-radius-rd);
      background-color: var(--ev-slider-thumb-bg);
      cursor: grab;
      pointer-events: auto;
    }

    &::-moz-range-thumb {
      box-sizing: border-box;
      width: var(--ev-slider-thumb);
      height: var(--ev-slider-thumb);
      border: var(--ev-stroke-sm) solid var(--ev-slider-thumb-border);
      border-radius: var(--ev-radius-rd);
      background-color: var(--ev-slider-thumb-bg);
      cursor: grab;
      pointer-events: auto;
    }

    &:focus-visible::-webkit-slider-thumb {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }

    &:focus-visible::-moz-range-thumb {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  &__values {
    position: absolute;
    display: flex;
    justify-content: space-between;
    color: var(--ev-text-primary);
    font-family: var(--ev-font-family-base);
    font-size: var(--ev-font-size-3xs);
    line-height: var(--ev-line-height-2xs);
    font-weight: var(--ev-font-weight-medium);
  }

  /* The board's default track is 300px across and 200px tall. */
  &--horizontal {
    width: 300px;
    height: var(--ev-slider-thumb);

    .ev-slider__track {
      top: 50%;
      right: 0;
      left: 0;
      height: var(--ev-slider-thickness);
      transform: translateY(-50%);
    }

    .ev-slider__fill {
      top: 0;
      height: 100%;
    }

    .ev-slider__input {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .ev-slider__values {
      top: 100%;
      right: 0;
      left: 0;
    }
  }

  &--vertical {
    width: var(--ev-slider-thumb);
    height: 200px;

    .ev-slider__track {
      top: 0;
      bottom: 0;
      left: 50%;
      width: var(--ev-slider-thickness);
      transform: translateX(-50%);
    }

    .ev-slider__fill {
      left: 0;
      width: 100%;
    }

    .ev-slider__input {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      writing-mode: vertical-lr;
      direction: rtl;
    }

    .ev-slider__values {
      flex-direction: column-reverse;
      top: 0;
      bottom: 0;
      left: 100%;
      padding-left: 6px;
    }
  }

  /*
   * In range mode the lower input sits under the upper one. Both must stay
   * reachable, so the inputs themselves ignore the pointer and only their
   * thumbs take it.
   */
  &--range {
    .ev-slider__input {
      pointer-events: none;
    }
  }

  &--destructive {
    --ev-slider-track: #99151540;
    --ev-slider-fill: #991515;
    --ev-slider-thumb-bg: var(--ev-ext-error);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;

    .ev-slider__input {
      cursor: not-allowed;
    }
  }
}
</style>
