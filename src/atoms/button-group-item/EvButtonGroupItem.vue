<script setup lang="ts">
import { computed, inject } from 'vue'
import { BUTTON_GROUP_KEY } from './context'
import type { ButtonGroupSize, ButtonGroupVariant } from '../../types'

defineOptions({
  name: 'EvButtonGroupItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Overrides the group's variant for this one item. */
    variant?: ButtonGroupVariant
    size?: ButtonGroupSize
    /** Marks this item as the current choice. */
    active?: boolean
    disabled?: boolean
    /** Square item holding only an icon. Give it an `aria-label`. */
    iconOnly?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: undefined,
    size: undefined,
    active: false,
    disabled: false,
    iconOnly: false,
    type: 'button',
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

defineSlots<{
  default?: () => unknown
  iconLeft?: () => unknown
  iconRight?: () => unknown
}>()

const group = inject(BUTTON_GROUP_KEY, null)

const variant = computed<ButtonGroupVariant>(
  () => props.variant ?? group?.variant.value ?? 'default-light',
)
const size = computed<ButtonGroupSize>(() => props.size ?? group?.size.value ?? 'large')

function onClick(event: MouseEvent) {
  if (props.disabled) {
    event.preventDefault()
    event.stopPropagation()
    return
  }
  emit('click', event)
}
</script>

<template>
  <button
    v-bind="$attrs"
    :type="type"
    class="ev-button-group__item"
    :class="[
      `ev-button-group__item--${variant}`,
      `ev-button-group__item--${size}`,
      { 'ev-button-group__item--icon-only': iconOnly },
    ]"
    :aria-pressed="active"
    :disabled="disabled"
    @click="onClick"
  >
    <slot name="iconLeft" />
    <span v-if="!iconOnly" class="ev-button-group__label"><slot /></span>
    <slot name="iconRight" />
  </button>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `ButtonGroup Item` component set in Figma (160 variants:
 * Variant x Type x State x Size x Icon Only).
 *
 * Figma's `Type` (First / Middle / Last / Button Only) is purely positional, so
 * it is not a prop: `:first-child`, `:last-child` and `:only-child` derive it
 * from the DOM. That removes forty of the board's variants from the API without
 * losing any of them.
 *
 * Note the label is `body/small` here - a step down from the standalone
 * Button's `body/regular` - and the divider between items is a left border on
 * every item after the first.
 */
.ev-button-group__item {
  --ev-button-group-item-bg: var(--ev-bg-secondary);
  --ev-button-group-item-bg-hover: var(--ev-bg-subtler);
  --ev-button-group-item-divider: var(--ev-border-tertiary);
  --ev-button-group-item-fg: var(--ev-text-primary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background-color: var(--ev-button-group-item-bg);
  color: var(--ev-button-group-item-fg);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/small');

  &:hover:not(:disabled) {
    background-color: var(--ev-button-group-item-bg-hover);
  }

  /*
   * The board draws only Default and Hover, but the usage doc says to "mark
   * the active item as selected". The selected item therefore holds the hover
   * fill - the one darker step the variant already defines - rather than
   * inventing a colour the design system has not chosen.
   */
  &[aria-pressed='true'] {
    background-color: var(--ev-button-group-item-bg-hover);
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
    /* Keeps the ring above the neighbour's divider. */
    z-index: 1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Position, derived rather than declared. */
  & + & {
    border-left: var(--ev-stroke-xs) solid var(--ev-button-group-item-divider);
  }

  &:first-child {
    border-top-left-radius: var(--ev-radius-sm);
    border-bottom-left-radius: var(--ev-radius-sm);
  }

  &:last-child {
    border-top-right-radius: var(--ev-radius-sm);
    border-bottom-right-radius: var(--ev-radius-sm);
  }

  &--large {
    min-height: 40px;
    padding: var(--ev-spacing-md) var(--ev-spacing-lg);
    gap: var(--ev-spacing-xs);
  }

  &--small {
    min-height: 32px;
    padding: var(--ev-spacing-sm);
    gap: var(--ev-spacing-2xs);
  }

  &--icon-only {
    padding-right: var(--ev-spacing-sm);
    padding-left: var(--ev-spacing-sm);
  }

  &--default-light {
    --ev-button-group-item-bg: var(--ev-bg-secondary);
    --ev-button-group-item-bg-hover: var(--ev-bg-subtler);
    --ev-button-group-item-divider: var(--ev-border-tertiary);
    --ev-button-group-item-fg: var(--ev-text-primary);
  }

  &--default-white {
    --ev-button-group-item-bg: var(--ev-bg-primary);
    --ev-button-group-item-bg-hover: var(--ev-bg-subtler);
    --ev-button-group-item-divider: var(--ev-border-tertiary);
    --ev-button-group-item-fg: var(--ev-text-primary);
  }

  /*
   * The three filled variants darken to their own bold step on hover, and
   * their divider is that same bold step - so a hovered item merges into its
   * neighbour's edge rather than showing a seam.
   */
  &--primary {
    --ev-button-group-item-bg: var(--ev-brand-primary);
    --ev-button-group-item-bg-hover: var(--ev-brand-primary-bold);
    --ev-button-group-item-divider: var(--ev-brand-primary-bold);
    --ev-button-group-item-fg: var(--ev-text-inverse);
  }

  &--destructive {
    --ev-button-group-item-bg: var(--ev-ext-error);
    --ev-button-group-item-bg-hover: var(--ev-ext-error-bold);
    --ev-button-group-item-divider: var(--ev-ext-error-bold);
    --ev-button-group-item-fg: var(--ev-text-inverse);
  }

  /* Warning keeps dark text - its fill is too light for inverse. */
  &--warning {
    --ev-button-group-item-bg: var(--ev-ext-warning);
    --ev-button-group-item-bg-hover: var(--ev-ext-warning-bold);
    --ev-button-group-item-divider: var(--ev-ext-warning-bold);
    --ev-button-group-item-fg: var(--ev-text-primary);
  }
}
</style>
