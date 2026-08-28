<script setup lang="ts">
import type { BadgeVariant } from '../../types'

defineOptions({
  name: 'EvBadge',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    variant?: BadgeVariant
    /**
     * Figma's `Reverse Colors` property: swaps the tinted badge for a solid
     * fill with inverse text.
     */
    reverse?: boolean
  }>(),
  {
    variant: 'neutral',
    reverse: false,
  },
)

defineSlots<{
  default?: () => unknown
  iconLeft?: () => unknown
  iconRight?: () => unknown
}>()
</script>

<template>
  <span
    v-bind="$attrs"
    class="ev-badge"
    :class="[`ev-badge--${variant}`, { 'ev-badge--reverse': reverse }]"
  >
    <slot name="iconLeft" />
    <span class="ev-badge__label"><slot /></span>
    <slot name="iconRight" />
  </span>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Badge` component set in Figma (12 variants: Variant x
 * Reverse Colors).
 *
 * Each variant sets four component properties, which keeps the two colour
 * schemes from having to repeat the layout. Reversed badges drop their border
 * by leaving `--ev-badge-border` unset.
 */
.ev-badge {
  --ev-badge-bg: var(--ev-bg-tertiary);
  --ev-badge-border: var(--ev-border-primary);
  --ev-badge-fg: var(--ev-text-secondary);
  --ev-badge-icon: var(--ev-badge-fg);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ev-spacing-xs);
  min-height: 24px;
  padding: var(--ev-spacing-xs) var(--ev-spacing-sm);
  border: var(--ev-stroke-xs) solid var(--ev-badge-border);
  border-radius: var(--ev-radius-3xs);
  background-color: var(--ev-badge-bg);
  color: var(--ev-badge-fg);
  white-space: nowrap;

  @include type.style('body/small');

  /* Icons carry their own colour in the Draft and Neutral-reversed variants. */
  svg {
    color: var(--ev-badge-icon);
    flex-shrink: 0;
  }

  &--success {
    --ev-badge-bg: var(--ev-ext-success-subtler);
    --ev-badge-border: var(--ev-ext-success-subtle);
    --ev-badge-fg: var(--ev-ext-success-bold);
  }

  &--waiting {
    --ev-badge-bg: var(--ev-ext-warning-subtler);
    --ev-badge-border: var(--ev-ext-warning-subtle);
    --ev-badge-fg: var(--ev-ext-warning-bold);
  }

  &--neutral {
    --ev-badge-bg: var(--ev-bg-tertiary);
    --ev-badge-border: var(--ev-border-primary);
    --ev-badge-fg: var(--ev-text-secondary);
  }

  /* The only variant whose icon is a step bolder than its label. */
  &--draft {
    --ev-badge-bg: var(--ev-brand-primary-subtle);
    --ev-badge-border: var(--ev-brand-primary-200);
    --ev-badge-fg: var(--ev-brand-primary);
    --ev-badge-icon: var(--ev-brand-primary-bold);
  }

  &--reject {
    --ev-badge-bg: var(--ev-ext-error-subtler);
    --ev-badge-border: var(--ev-ext-error-subtle);
    --ev-badge-fg: var(--ev-ext-error-bold);
  }

  /* Custom is the only tinted variant drawn without a border. */
  &--custom {
    --ev-badge-bg: var(--ev-brand-secondary-subtle);
    --ev-badge-border: transparent;
    --ev-badge-fg: var(--ev-brand-secondary-bold);
  }

  &--reverse {
    --ev-badge-border: transparent;
    --ev-badge-fg: var(--ev-text-inverse);
    --ev-badge-icon: var(--ev-text-inverse);

    &.ev-badge--success {
      --ev-badge-bg: var(--ev-ext-success);
    }

    &.ev-badge--waiting {
      --ev-badge-bg: var(--ev-ext-warning);
    }

    /*
     * Neutral is the exception: reversing keeps the tinted fill and only
     * darkens the label, so it never becomes a solid block.
     */
    &.ev-badge--neutral {
      --ev-badge-bg: var(--ev-bg-tertiary);
      --ev-badge-fg: var(--ev-text-primary);
      --ev-badge-icon: var(--ev-icon-primary);
    }

    &.ev-badge--draft {
      --ev-badge-bg: var(--ev-brand-primary);
    }

    &.ev-badge--reject {
      --ev-badge-bg: var(--ev-ext-error);
    }

    &.ev-badge--custom {
      --ev-badge-bg: var(--ev-brand-secondary);
    }
  }
}
</style>
