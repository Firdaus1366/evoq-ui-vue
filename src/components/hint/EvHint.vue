<script setup lang="ts">
import { computed } from 'vue'
import type { HintSize } from '../../types'

defineOptions({
  name: 'EvHint',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    size?: HintSize
    /** Count to display. Leave unset for the bare dot. */
    value?: number | string
    /** Counts above this render as `{max}+`, matching Figma's `99+` variant. */
    max?: number
    /** Force the dot even when a value is given. */
    dot?: boolean
  }>(),
  {
    size: 'medium',
    value: undefined,
    max: 99,
    dot: false,
  },
)

const isHidden = computed(() => props.value === 0)
const isDot = computed(() => props.dot || props.value === undefined || props.value === null)

const label = computed(() => {
  if (isDot.value || isHidden.value) return ''
  return typeof props.value === 'number' && props.value > props.max
    ? `${props.max}+`
    : String(props.value)
})

/** Figma widens the pill's padding once the label reaches three characters. */
const isWide = computed(() => label.value.length >= 3)
</script>

<template>
  <span
    v-if="!isHidden"
    v-bind="$attrs"
    class="ev-hint"
    :class="[
      `ev-hint--${size}`,
      isDot ? 'ev-hint--dot' : 'ev-hint--count',
      { 'ev-hint--wide': isWide },
    ]"
  >
    <template v-if="!isDot">{{ label }}</template>
  </span>
</template>

<style lang="scss">
/*
 * Traced from the `Hint` component set in Figma (12 variants: Size x Type).
 * Every variant is `ext/error` on inverse text - the type only changes the
 * geometry, never the colour.
 */
.ev-hint {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ev-radius-rd);
  background-color: var(--ev-ext-error);
  color: var(--ev-text-inverse);
  font-family: var(--ev-font-family-base);
  font-weight: var(--ev-font-weight-medium);
  line-height: var(--ev-line-height-xs);
  white-space: nowrap;

  /* The dot has no label, so it is sized rather than padded. */
  &--dot {
    padding: 0;

    &.ev-hint--large {
      width: 16px;
      height: 16px;
    }

    &.ev-hint--medium {
      width: 10px;
      height: 10px;
    }

    &.ev-hint--small {
      width: 8px;
      height: 8px;
    }
  }

  /*
   * A count is a pill: at least as wide as it is tall, growing with its
   * label. `min-width` is what keeps a single digit circular.
   */
  &--count {
    padding: 0 var(--ev-spacing-xs);

    &.ev-hint--large {
      min-width: 24px;
      height: 24px;
      font-size: var(--ev-font-size-sm);
    }

    &.ev-hint--medium {
      min-width: 16px;
      height: 16px;
      font-size: var(--ev-font-size-sm);
    }

    &.ev-hint--small {
      min-width: 16px;
      height: 16px;
      font-size: var(--ev-font-size-2xs);
    }
  }

  &--large.ev-hint--wide {
    padding: 0 var(--ev-spacing-sm);
  }
}
</style>
