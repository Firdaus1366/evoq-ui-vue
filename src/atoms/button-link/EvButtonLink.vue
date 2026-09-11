<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonLinkVariant } from '../../types'

defineOptions({
  name: 'EvButtonLink',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    variant?: ButtonLinkVariant
    /** Renders an anchor instead of a button. */
    href?: string
    disabled?: boolean
    /**
     * The link is the current item - a breadcrumb's page. Pins the variant's
     * `State=Active` look and sets `aria-current="page"`; without an `href`
     * it renders as plain text, since the current page is not a destination.
     */
    current?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    href: undefined,
    disabled: false,
    current: false,
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

/**
 * An anchor without an `href` is not focusable, so a disabled link is a
 * button. The current item with nowhere to go is not a control at all.
 */
const tag = computed(() => {
  if (props.href && !props.disabled) return 'a'
  return props.current ? 'span' : 'button'
})

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
  <component
    :is="tag"
    v-bind="$attrs"
    class="ev-button-link"
    :class="[
      `ev-button-link--${variant}`,
      { 'ev-button-link--disabled': disabled, 'ev-button-link--current': current },
    ]"
    :aria-current="current ? 'page' : undefined"
    :href="tag === 'a' ? href : undefined"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' && disabled ? true : undefined"
    :aria-disabled="disabled || undefined"
    @click="onClick"
  >
    <slot name="iconLeft" />
    <span class="ev-button-link__label"><slot /></span>
    <slot name="iconRight" />
  </component>
</template>

<style lang="scss">
/*
 * Traced from the `ButtonLink` component set in Figma (15 variants: Variant x
 * State).
 *
 * Figma's `State=Active` is the pressed state, and every variant fades to a
 * grey when pressed rather than darkening - the only exception being Invert,
 * which fades to `text/tertiary` so it stays legible on a dark surface.
 */
.ev-button-link {
  --ev-link-fg: var(--ev-brand-primary);
  --ev-link-icon: var(--ev-brand-primary);

  display: inline-flex;
  align-items: center;
  gap: var(--ev-spacing-xs);
  padding: 0;
  border: 0;
  background: none;
  color: var(--ev-link-fg);
  font-family: var(--ev-font-family-base);
  font-size: var(--ev-font-size-sm);
  line-height: var(--ev-line-height-xs);
  font-weight: var(--ev-font-weight-medium);
  text-decoration: none;
  cursor: pointer;

  svg {
    color: var(--ev-link-icon);
    flex-shrink: 0;
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }

  /*
   * The design thickens the label on hover rather than underlining it, which
   * is reproduced here as drawn. Be aware it reflows the line by a pixel or
   * two; a consumer who cannot accept that should override `font-weight` on
   * hover rather than the whole rule.
   */
  &:hover:not(:disabled) {
    font-weight: var(--ev-font-weight-bold);
  }

  /* The current item is where you already are: no pointer, no hover weight. */
  &.ev-button-link--current,
  &.ev-button-link--current:hover {
    cursor: default;
    font-weight: var(--ev-font-weight-medium);
  }

  &--primary {
    --ev-link-fg: var(--ev-brand-primary);
    --ev-link-icon: var(--ev-brand-primary);

    &:hover:not(:disabled) {
      --ev-link-fg: var(--ev-brand-primary-bold);
      --ev-link-icon: var(--ev-brand-primary-bold);
    }

    &:active:not(:disabled),
    &.ev-button-link--current {
      --ev-link-fg: var(--ev-text-secondary);
      --ev-link-icon: var(--ev-icon-secondary);
    }
  }

  &--secondary {
    --ev-link-fg: var(--ev-text-secondary);
    --ev-link-icon: var(--ev-icon-secondary);

    &:active:not(:disabled),
    &.ev-button-link--current {
      --ev-link-fg: var(--ev-text-primary);
      --ev-link-icon: var(--ev-text-secondary);
    }
  }

  &--tertiary {
    --ev-link-fg: var(--ev-text-primary);
    --ev-link-icon: var(--ev-text-secondary);

    &:active:not(:disabled),
    &.ev-button-link--current {
      --ev-link-fg: var(--ev-text-secondary);
      --ev-link-icon: var(--ev-icon-secondary);
    }
  }

  &--invert {
    --ev-link-fg: var(--ev-text-inverse);
    --ev-link-icon: var(--ev-text-inverse);

    &:active:not(:disabled),
    &.ev-button-link--current {
      --ev-link-fg: var(--ev-text-tertiary);
      --ev-link-icon: var(--ev-text-tertiary);
    }
  }

  /*
   * Custom's label is the secondary brand but its icons stay on the primary
   * brand. That looks like an upstream slip, but it is what the board draws.
   */
  &--custom {
    --ev-link-fg: var(--ev-brand-secondary);
    --ev-link-icon: var(--ev-brand-primary);

    &:hover:not(:disabled) {
      --ev-link-fg: var(--ev-brand-secondary-bold);
      --ev-link-icon: var(--ev-brand-primary-bold);
    }

    &:active:not(:disabled),
    &.ev-button-link--current {
      --ev-link-fg: var(--ev-text-secondary);
      --ev-link-icon: var(--ev-icon-secondary);
    }
  }

  &--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
