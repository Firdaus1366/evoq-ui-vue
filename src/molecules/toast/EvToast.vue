<script setup lang="ts">
import { computed } from 'vue'
import type { ToastVariant } from '../../types'

defineOptions({
  name: 'EvToast',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** `Type` of the Figma `Toast` set. */
    variant?: ToastVariant
    title?: string
    /**
     * Supporting line. The board reaches it through `Type=WithDescription`;
     * setting it here switches the toast to that layout whatever the variant.
     */
    description?: string
    /** Renders the dismiss cross and enables the `close` event. */
    dismissible?: boolean
    closeLabel?: string
  }>(),
  {
    variant: 'default',
    title: undefined,
    description: undefined,
    dismissible: true,
    closeLabel: 'Tutup',
  },
)

const emit = defineEmits<{
  close: []
}>()

const slots = defineSlots<{
  default?: () => unknown
  description?: () => unknown
  /** Figma's Button instance on `Type=WithDescription`. */
  actions?: () => unknown
  icon?: () => unknown
}>()

/** The four semantic variants are the only ones the board gives a status icon. */
const hasStatusIcon = computed(
  () => Boolean(slots.icon) || ['success', 'error', 'warning', 'info'].includes(props.variant),
)
const stacked = computed(
  () => props.variant === 'with-description' || Boolean(props.description || slots.description),
)
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-toast"
    :class="[
      `ev-toast--${variant}`,
      stacked ? 'ev-toast--stacked' : 'ev-toast--inline',
      { 'ev-toast--with-icon': hasStatusIcon },
    ]"
    role="status"
    aria-live="polite"
  >
    <span v-if="hasStatusIcon" class="ev-toast__icon">
      <slot name="icon">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.4" />
          <path
            d="M8 5v.5M8 7.5v3.5"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
          />
        </svg>
      </slot>
    </span>

    <div class="ev-toast__content">
      <p class="ev-toast__title">
        <slot>{{ title }}</slot>
      </p>
      <p v-if="stacked" class="ev-toast__description">
        <slot name="description">{{ description }}</slot>
      </p>
    </div>

    <div v-if="slots.actions" class="ev-toast__actions"><slot name="actions" /></div>

    <button
      v-if="dismissible && !slots.actions"
      type="button"
      class="ev-toast__close"
      :aria-label="closeLabel"
      @click="emit('close')"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M4 4l8 8M12 4l-8 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Toast` component set in Figma (6 Types).
 *
 * Node tree, in board order:
 *   Toast          HORIZONTAL, padding 12, radius 12, bg/primary,
 *                  1px border/primary, elevation/md, 320 wide, 40 tall
 *     Icon         16 - Success ext/success, Error ext/error,
 *                  Warning ext/warning, Info ext/info. Absent on Default
 *     Content      Title 14 Medium text/primary
 *                  Description 12 Medium text/secondary (WithDescription)
 *     CloseIcon    16 icon/primary - or, on WithDescription, a Button instance
 *
 * Deviation, structural: the board nests the close glyph *inside* Content on
 * the four semantic variants (Content is horizontal there) and leaves it a
 * sibling on Default (Content is vertical, the row is space-between). The two
 * render identically, so the close button is a sibling in every variant here.
 * Keeping both nestings would have made the dismiss control's position in the
 * accessibility tree depend on whether a status icon happens to be shown.
 *
 * The Button on WithDescription is an instance where the caller's content
 * goes, so it is the `actions` slot rather than a hard-coded EvButton.
 */
.ev-toast {
  --ev-toast-icon: var(--ev-icon-primary);

  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-sm);
  width: 320px;
  max-width: 100%;
  padding: var(--ev-spacing-md);
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-md);
  background-color: var(--ev-bg-primary);
  box-shadow: var(--ev-elevation-md);

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-toast-icon);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--ev-spacing-2xs);
    min-width: 0;
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('body/regular');
  }

  &__description {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/small');
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  &__close {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-primary);
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

  &--success {
    --ev-toast-icon: var(--ev-ext-success);
  }

  &--error {
    --ev-toast-icon: var(--ev-ext-error);
  }

  &--warning {
    --ev-toast-icon: var(--ev-ext-warning);
  }

  &--info {
    --ev-toast-icon: var(--ev-ext-info);
  }
}
</style>
