<script setup lang="ts">
import type { DropdownItemVariant } from '../../types'

defineOptions({
  name: 'EvDropdownItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /**
     * `list` is the plain 24px row; `list-box` is the taller 32px row the board
     * uses once a checkbox or avatar sits beside the label.
     */
    variant?: DropdownItemVariant
    /** Figma's `Active` state - the currently chosen option. */
    active?: boolean
    disabled?: boolean
    label?: string
  }>(),
  {
    variant: 'list',
    active: false,
    disabled: false,
    label: undefined,
  },
)

const emit = defineEmits<{
  select: []
}>()

defineSlots<{
  default?: () => unknown
  /** Figma's `Slot Left` - an icon, checkbox or avatar. */
  iconLeft?: () => unknown
  /** Figma's `Slot Right` - a trailing glyph, such as a tick. */
  iconRight?: () => unknown
}>()

function select() {
  if (props.disabled) return
  emit('select')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  select()
}
</script>

<template>
  <li
    v-bind="$attrs"
    class="ev-dropdown-item"
    :class="[
      `ev-dropdown-item--${variant}`,
      { 'ev-dropdown-item--active': active, 'ev-dropdown-item--disabled': disabled },
    ]"
    role="option"
    :aria-selected="active"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    @click="select"
    @keydown="onKeydown"
  >
    <slot name="iconLeft" />
    <span class="ev-dropdown-item__label"
      ><slot>{{ label }}</slot></span
    >
    <slot name="iconRight" />
  </li>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.List Text` component set in Figma (Variant x State).
 *
 * The board's Disabled state is drawn identically to Default - no dimming, no
 * colour change - which reads as an oversight rather than intent. The library's
 * usual disabled treatment is applied instead, so a dead option does not look
 * live. Everything else follows the board.
 */
.ev-dropdown-item {
  --ev-dropdown-item-bg: transparent;

  box-sizing: border-box;
  display: flex;
  align-items: center;
  background-color: var(--ev-dropdown-item-bg);
  color: var(--ev-text-primary);
  cursor: pointer;

  @include type.style('body/regular');

  &__label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
  }

  /* The plain row. */
  &--list {
    min-height: 24px;
    padding: var(--ev-spacing-xs) var(--ev-spacing-sm);
    gap: var(--ev-spacing-xs);
  }

  /* Taller, and roomier, to seat a checkbox or a 24px avatar. */
  &--list-box {
    min-height: 32px;
    padding: var(--ev-spacing-xs) var(--ev-spacing-sm);
    gap: var(--ev-spacing-sm);
  }

  &:hover:not(.ev-dropdown-item--disabled) {
    --ev-dropdown-item-bg: var(--ev-bg-subtle);
  }

  /* Selected outranks hover. */
  &--active,
  &--active:hover {
    --ev-dropdown-item-bg: var(--ev-brand-primary-subtle);
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
