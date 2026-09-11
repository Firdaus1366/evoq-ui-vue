<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ToggleSize, ToggleVariant } from '../../types'
import { TOGGLE_GROUP_KEY } from './context'

defineOptions({
  name: 'EvToggle',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Pressed state. */
    modelValue?: boolean
    variant?: ToggleVariant
    size?: ToggleSize
    disabled?: boolean
  }>(),
  {
    modelValue: false,
    variant: undefined,
    size: undefined,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const group = inject(TOGGLE_GROUP_KEY, null)
const resolvedVariant = computed(() => props.variant ?? group?.variant.value ?? 'default')
const resolvedSize = computed(() => props.size ?? group?.size.value ?? 'default')

defineSlots<{
  default?: () => unknown
  iconLeft?: () => unknown
  iconRight?: () => unknown
}>()

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    class="ev-toggle"
    :class="[
      `ev-toggle--${resolvedVariant}`,
      `ev-toggle--size-${resolvedSize}`,
      { 'ev-toggle--active': modelValue, 'ev-toggle--disabled': disabled },
    ]"
    :aria-pressed="modelValue"
    :disabled="disabled"
    @click="toggle"
  >
    <slot name="iconLeft" />
    <span class="ev-toggle__label"><slot /></span>
    <slot name="iconRight" />
  </button>
</template>

<style lang="scss">
/*
 * Traced from the `Toggle` component set in Figma (16 variants: Variant x Size
 * x State).
 *
 * Figma names four states, but Disabled Nonactive and Disabled Active are just
 * the two live states at 50% - except for Outline, whose disabled-active fill
 * is `bg/subtle` rather than the `bg/subtler` it uses when live. That one
 * exception is the reason disabled is not simply an opacity rule.
 */
.ev-toggle {
  --ev-toggle-bg: var(--ev-bg-subtle);
  --ev-toggle-border: transparent;
  --ev-toggle-fg: var(--ev-text-primary);
  --ev-toggle-icon: var(--ev-icon-primary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ev-spacing-2xs);
  border: var(--ev-stroke-xs) solid var(--ev-toggle-border);
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-toggle-bg);
  color: var(--ev-toggle-fg);
  font-family: var(--ev-font-family-base);
  font-weight: var(--ev-font-weight-medium);
  line-height: var(--ev-line-height-xs);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ev-duration-fast) var(--ev-easing-standard),
    border-color var(--ev-duration-fast) var(--ev-easing-standard),
    color var(--ev-duration-fast) var(--ev-easing-standard);

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }

  svg {
    color: var(--ev-toggle-icon);
    flex-shrink: 0;
  }

  /*
   * Sizes are namespaced because this set has both a `default` variant and a
   * `default` size - without the prefix the two would collide on one class.
   */
  &--size-default {
    min-height: 32px;
    padding: var(--ev-spacing-sm);
    font-size: var(--ev-font-size-sm);
  }

  &--size-small {
    min-height: 24px;
    padding: var(--ev-spacing-xs);
    font-size: var(--ev-font-size-xs);
  }

  /* Variants */
  &--outline {
    --ev-toggle-bg: transparent;
    --ev-toggle-border: var(--ev-border-primary);
    --ev-toggle-fg: var(--ev-text-secondary);
    --ev-toggle-icon: var(--ev-icon-secondary);
  }

  &--active {
    --ev-toggle-bg: var(--ev-brand-primary);
    --ev-toggle-border: transparent;
    --ev-toggle-fg: var(--ev-text-inverse);
    --ev-toggle-icon: var(--ev-text-inverse);

    /* Outline stays grey when pressed - it never takes the brand fill. */
    &.ev-toggle--outline {
      --ev-toggle-bg: var(--ev-bg-subtler);
      --ev-toggle-border: transparent;
      --ev-toggle-fg: var(--ev-text-secondary);
      --ev-toggle-icon: var(--ev-icon-secondary);
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;

    /* The one place disabled changes a colour rather than just dimming it. */
    &.ev-toggle--outline.ev-toggle--active {
      --ev-toggle-bg: var(--ev-bg-subtle);
    }
  }
}
</style>
