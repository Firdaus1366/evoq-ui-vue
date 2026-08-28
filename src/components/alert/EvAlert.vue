<script setup lang="ts">
import { computed } from 'vue'
import type { AlertVariant } from '../../types'

defineOptions({
  name: 'EvAlert',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
    /** Swaps the tinted alert for a solid fill with inverse text. */
    inverse?: boolean
    title?: string
    /** Supporting line. Its presence switches the alert to the taller layout. */
    subtext?: string
    /** Renders the dismiss button and enables the `close` event. */
    dismissible?: boolean
    closeLabel?: string
  }>(),
  {
    variant: 'neutral',
    inverse: false,
    title: undefined,
    subtext: undefined,
    dismissible: false,
    closeLabel: 'Tutup',
  },
)

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default?: () => unknown
  subtext?: () => unknown
  /** Inline link rendered below the message (Figma's `Has Link`). */
  link?: () => unknown
  /** Trailing controls, such as a confirm button (Figma's `Has Button`). */
  actions?: () => unknown
  icon?: () => unknown
}>()

/**
 * Figma models this as `Has Subtext`. Deriving it from the content means the
 * caller cannot end up in the tall layout with nothing to put in it.
 */
const hasSubtext = computed(() => Boolean(props.subtext || slots.subtext || slots.link))

/** `neutral-dark` is already a dark surface, so it never takes an inverse. */
const isInverse = computed(
  () => props.inverse && props.variant !== 'neutral' && props.variant !== 'neutral-dark',
)
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-alert"
    :class="[
      `ev-alert--${variant}`,
      hasSubtext ? 'ev-alert--stacked' : 'ev-alert--inline',
      { 'ev-alert--inverse': isInverse },
    ]"
    role="alert"
  >
    <span class="ev-alert__icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9.5" stroke="currentColor" stroke-width="1.6" fill="none" />
          <path
            d="M12 7.5v.5M12 11v5.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
      </slot>
    </span>

    <div class="ev-alert__body">
      <p class="ev-alert__title">
        <slot>{{ title }}</slot>
      </p>
      <p v-if="subtext || slots.subtext" class="ev-alert__subtext">
        <slot name="subtext">{{ subtext }}</slot>
      </p>
      <div v-if="slots.link" class="ev-alert__link">
        <slot name="link" />
      </div>
    </div>

    <div v-if="slots.actions" class="ev-alert__actions"><slot name="actions" /></div>

    <button
      v-if="dismissible"
      type="button"
      class="ev-alert__close"
      :aria-label="closeLabel"
      @click="emit('close')"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" fill="none" />
      </svg>
    </button>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Alert` component set in Figma (20 variants: Variant x
 * Has Subtext x Inverse).
 *
 * Two upstream inconsistencies are reproduced as drawn rather than smoothed
 * over: the two neutral variants use `radius/sm` where the semantic ones use
 * `radius/xs`, and Info keeps a `text/primary` title where Success, Error and
 * Warning colour theirs to match the variant.
 */
.ev-alert {
  --ev-alert-bg: var(--ev-bg-secondary);
  --ev-alert-border: var(--ev-border-primary);
  --ev-alert-icon: var(--ev-icon-primary);
  --ev-alert-title: var(--ev-text-primary);
  --ev-alert-subtext: var(--ev-text-primary);
  --ev-alert-radius: var(--ev-radius-sm);

  box-sizing: border-box;
  display: flex;
  gap: var(--ev-spacing-sm);
  border: var(--ev-stroke-xs) solid var(--ev-alert-border);
  border-radius: var(--ev-alert-radius);
  background-color: var(--ev-alert-bg);

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-alert-icon);

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0;
    color: var(--ev-alert-title);
  }

  &__subtext {
    margin: 0;
    color: var(--ev-alert-subtext);

    @include type.style('body/small');
  }

  &__link {
    margin-top: var(--ev-spacing-xs);
    display: flex;
    align-items: center;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    flex-shrink: 0;
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-alert-icon);
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  /* With a subtext the alert is taller, its icon doubles, and the title bolds. */
  &--stacked {
    align-items: flex-start;
    padding: var(--ev-spacing-sm);

    .ev-alert__icon {
      width: 32px;
      height: 32px;
    }

    .ev-alert__title {
      @include type.style('body/regular-b');
    }
  }

  /* Without one it is a single padded line and the title stays medium. */
  &--inline {
    align-items: center;
    padding: var(--ev-spacing-sm) var(--ev-spacing-md);

    .ev-alert__icon {
      width: 16px;
      height: 16px;
    }

    .ev-alert__title {
      @include type.style('body/regular');
    }
  }

  &--neutral {
    --ev-alert-bg: var(--ev-bg-secondary);
    --ev-alert-border: var(--ev-border-primary);
    --ev-alert-icon: var(--ev-icon-primary);
    --ev-alert-title: var(--ev-text-primary);
    --ev-alert-subtext: var(--ev-text-primary);
  }

  &--neutral-dark {
    --ev-alert-bg: var(--ev-bg-inverse);
    --ev-alert-border: transparent;
    --ev-alert-icon: var(--ev-text-inverse);
    --ev-alert-title: var(--ev-text-inverse);
    --ev-alert-subtext: var(--ev-text-inverse);
  }

  /* Info is the one semantic variant whose title is not tinted. */
  &--info {
    --ev-alert-bg: var(--ev-ext-info-subtler);
    --ev-alert-border: var(--ev-ext-info-bold);
    --ev-alert-icon: var(--ev-ext-info);
    --ev-alert-title: var(--ev-text-primary);
    --ev-alert-subtext: var(--ev-text-secondary);
    --ev-alert-radius: var(--ev-radius-xs);
  }

  &--success {
    --ev-alert-bg: var(--ev-ext-success-subtler);
    --ev-alert-border: var(--ev-ext-success-bold);
    --ev-alert-icon: var(--ev-ext-success);
    --ev-alert-title: var(--ev-ext-success-bold);
    --ev-alert-subtext: var(--ev-text-primary);
    --ev-alert-radius: var(--ev-radius-xs);
  }

  &--error {
    --ev-alert-bg: var(--ev-ext-error-subtler);
    --ev-alert-border: var(--ev-ext-error-bold);
    --ev-alert-icon: var(--ev-ext-error);
    --ev-alert-title: var(--ev-ext-error-bold);
    --ev-alert-subtext: var(--ev-text-primary);
    --ev-alert-radius: var(--ev-radius-xs);
  }

  &--warning {
    --ev-alert-bg: var(--ev-ext-warning-subtler);
    --ev-alert-border: var(--ev-ext-warning-bold);
    --ev-alert-icon: var(--ev-ext-warning);
    --ev-alert-title: var(--ev-ext-warning-bold);
    --ev-alert-subtext: var(--ev-text-primary);
    --ev-alert-radius: var(--ev-radius-xs);
  }

  /* Inverse fills with the variant's own colour and turns everything white. */
  &--inverse {
    --ev-alert-border: transparent;
    --ev-alert-icon: var(--ev-text-inverse);
    --ev-alert-title: var(--ev-text-inverse);
    --ev-alert-subtext: var(--ev-text-inverse);

    &.ev-alert--info {
      --ev-alert-bg: var(--ev-ext-info);
    }

    &.ev-alert--success {
      --ev-alert-bg: var(--ev-ext-success);
    }

    &.ev-alert--error {
      --ev-alert-bg: var(--ev-ext-error);
    }

    &.ev-alert--warning {
      --ev-alert-bg: var(--ev-ext-warning);
    }
  }
}
</style>
