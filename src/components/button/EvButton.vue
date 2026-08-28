<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonSize, ButtonVariant } from '../../types'

defineOptions({
  name: 'EvButton',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Visual weight of the button. */
    variant?: ButtonVariant
    /** Control height: 40px (`default`) or 32px (`small`). */
    size?: ButtonSize
    disabled?: boolean
    /** Shows a spinner and blocks interaction. */
    loading?: boolean
    /** Stretch to the full width of the parent. */
    block?: boolean
    /**
     * Render as a square control holding only an icon. Pass the icon through
     * the `iconLeft` slot, and give the button an `aria-label` - there is no
     * visible text for a screen reader to announce.
     */
    iconOnly?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'default',
    disabled: false,
    loading: false,
    block: false,
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

const isInert = computed(() => props.disabled || props.loading)

function onClick(event: MouseEvent) {
  if (isInert.value) {
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
    class="ev-button"
    :class="[
      `ev-button--${variant}`,
      `ev-button--${size}`,
      {
        'ev-button--block': block,
        'ev-button--loading': loading,
        'ev-button--icon-only': iconOnly,
      },
    ]"
    :type="type"
    :disabled="isInert"
    :aria-busy="loading || undefined"
    @click="onClick"
  >
    <span v-if="loading" class="ev-button__spinner" aria-hidden="true" />
    <slot name="iconLeft" />
    <span v-if="!iconOnly" class="ev-button__label"><slot /></span>
    <slot name="iconRight" />
  </button>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Button` component set in Figma (112 variants: 7 Variant x
 * 4 State x 2 Size x Icon Only). Figma's States map onto CSS as
 * Hover -> :hover, Pressed -> :active, Disable -> :disabled.
 *
 * Radius, type and border width are constant across the whole set, so they
 * live on the base class.
 */
.ev-button {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: var(--ev-stroke-xs) solid transparent;
  border-radius: var(--ev-radius-xs);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ev-duration-fast) var(--ev-easing-standard),
    border-color var(--ev-duration-fast) var(--ev-easing-standard),
    color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/regular');

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }

  /*
   * Every variant dims to 50% when disabled; Outline and Ghost additionally
   * pick up a resting fill, which is why those two override it below.
   */
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Sizes */
  &--default {
    min-height: 40px;
    padding: var(--ev-spacing-md) var(--ev-spacing-lg);
    gap: var(--ev-spacing-xs);
  }

  &--small {
    min-height: 32px;
    padding: var(--ev-spacing-sm);
    gap: var(--ev-spacing-2xs);
  }

  /* Icon only is a square of the same height as its size. */
  &--icon-only {
    padding: 0;

    &.ev-button--default {
      width: 40px;
    }

    &.ev-button--small {
      width: 32px;
    }
  }

  &--block {
    display: flex;
    width: 100%;
  }

  /* Variants */
  &--primary {
    background-color: var(--ev-brand-primary);
    color: var(--ev-text-inverse);

    &:hover:not(:disabled) {
      background-color: var(--ev-brand-primary-bold);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-brand-primary-bold);
      box-shadow: var(--ev-shadow-button-pressed);
    }
  }

  /* Tinted at rest, then fills solid on hover and drops its border. */
  &--secondary-light {
    background-color: var(--ev-brand-primary-subtle);
    border-color: var(--ev-brand-primary-200);
    color: var(--ev-brand-primary);

    &:hover:not(:disabled) {
      background-color: var(--ev-brand-primary);
      border-color: transparent;
      color: var(--ev-text-inverse);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-brand-primary-bold);
      border-color: transparent;
      color: var(--ev-text-inverse);
      box-shadow: var(--ev-shadow-button-pressed);
    }
  }

  &--secondary-grey {
    background-color: var(--ev-bg-tertiary);
    border-color: var(--ev-border-primary);
    color: var(--ev-text-primary);

    &:hover:not(:disabled) {
      background-color: var(--ev-bg-subtler);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-bg-subtlest);
      box-shadow: var(--ev-shadow-button-pressed);
    }
  }

  &--secondary-white {
    background-color: var(--ev-bg-primary);
    color: var(--ev-text-primary);

    &:hover:not(:disabled) {
      background-color: var(--ev-bg-subtler);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-bg-subtlest);
      box-shadow: var(--ev-shadow-button-pressed);
    }
  }

  /* Pressed keeps the resting fill and reads as pressed from the inset alone. */
  &--destructive {
    background-color: var(--ev-ext-error);
    color: var(--ev-text-inverse);

    &:hover:not(:disabled) {
      background-color: var(--ev-ext-error-bold);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-ext-error);
      box-shadow: var(--ev-shadow-button-pressed);
    }
  }

  &--outline {
    background-color: transparent;
    border-color: var(--ev-border-primary);
    color: var(--ev-text-primary);

    &:hover:not(:disabled) {
      background-color: var(--ev-bg-subtler);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-bg-subtler);
      box-shadow: var(--ev-shadow-button-pressed);
    }

    &:disabled {
      background-color: var(--ev-bg-secondary);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--ev-text-primary);

    &:hover:not(:disabled) {
      background-color: var(--ev-bg-subtler);
    }

    &:active:not(:disabled) {
      background-color: var(--ev-bg-subtler);
      box-shadow: var(--ev-shadow-button-pressed);
    }

    &:disabled {
      background-color: var(--ev-bg-secondary);
    }
  }

  /* Loading spinner */
  &__spinner {
    width: 1em;
    height: 1em;
    border: var(--ev-stroke-sm) solid currentcolor;
    border-right-color: transparent;
    border-radius: var(--ev-radius-rd);
    animation: ev-button-spin 0.6s linear infinite;
  }
}

@keyframes ev-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ev-button {
    transition: none;

    &__spinner {
      animation-duration: 1.8s;
    }
  }
}
</style>
