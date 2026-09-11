<script setup lang="ts">
import { ref, toRef, useId } from 'vue'
import { useOverlay } from '../../composables/useOverlay'
import type { AlertDialogVariant } from '../../types'

defineOptions({
  name: 'EvAlertDialog',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    variant?: AlertDialogVariant
    title?: string
    description?: string
    /**
     * `desktop` uses the board's large illustration; `compact` uses the mobile
     * layout, where the artwork becomes a 40px icon tile and the buttons stack.
     */
    layout?: 'desktop' | 'compact'
    /** Set false to force a deliberate choice from the buttons. */
    closeOnScrim?: boolean
  }>(),
  {
    modelValue: false,
    variant: 'confirmation',
    title: undefined,
    description: undefined,
    layout: 'desktop',
    closeOnScrim: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

defineSlots<{
  /** Figma's `Slot` - extra content under the description. */
  default?: () => unknown
  title?: () => unknown
  description?: () => unknown
  /**
   * The board draws a per-variant illustration here. Those are artwork rather
   * than tokens, so the library ships an icon tile and leaves the picture to
   * the consumer.
   */
  media?: () => unknown
  /** The buttons. The board puts the confirm action last on desktop. */
  actions?: () => unknown
}>()

const panel = ref<HTMLElement | null>(null)
const titleId = `ev-alert-dialog-title-${useId()}`

function close() {
  emit('update:modelValue', false)
  emit('close')
}

useOverlay({ open: toRef(props, 'modelValue'), panel, onEscape: close })
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ev-alert-dialog">
      <div class="ev-alert-dialog__scrim" @click="closeOnScrim && close()" />

      <div
        ref="panel"
        v-bind="$attrs"
        class="ev-alert-dialog__panel"
        :class="[`ev-alert-dialog__panel--${layout}`, `ev-alert-dialog__panel--${variant}`]"
        role="alertdialog"
        aria-modal="true"
        :aria-labelledby="title || $slots.title ? titleId : undefined"
        tabindex="-1"
      >
        <div class="ev-alert-dialog__body">
          <div class="ev-alert-dialog__media">
            <slot name="media">
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  stroke="currentColor"
                  stroke-width="1.6"
                  fill="none"
                />
                <path
                  d="M12 7.5v.5M12 11v5.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </slot>
          </div>

          <div class="ev-alert-dialog__heading">
            <p :id="titleId" class="ev-alert-dialog__title">
              <slot name="title">{{ title }}</slot>
            </p>
            <p v-if="description || $slots.description" class="ev-alert-dialog__description">
              <slot name="description">{{ description }}</slot>
            </p>
          </div>

          <div v-if="$slots.default" class="ev-alert-dialog__slot"><slot /></div>
        </div>

        <div v-if="$slots.actions" class="ev-alert-dialog__actions"><slot name="actions" /></div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `D - AlertDialog` and `M - AlertDialog` component sets
 * (5 variants each).
 *
 * The two sets are one dialog at two sizes, so they are a `layout` prop rather
 * than two components: desktop centres a 180px illustration above the text and
 * puts the actions in a row; compact swaps the illustration for a 40px tile and
 * stacks the actions full-width, confirm first.
 *
 * The variant only tints the icon tile - the board's per-variant artwork is
 * illustration, not something a component library can carry.
 */
.ev-alert-dialog {
  position: fixed;
  inset: 0;
  z-index: var(--ev-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ev-spacing-lg);

  &__scrim {
    position: absolute;
    inset: 0;
    background-color: var(--ev-bg-overlay);
    opacity: 0.8;
  }

  &__panel {
    --ev-alert-dialog-media-bg: var(--ev-bg-subtle);
    --ev-alert-dialog-media-fg: var(--ev-icon-primary);

    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xl);
    width: 100%;
    max-height: calc(100vh - var(--ev-spacing-2xl));
    border-radius: var(--ev-radius-md);
    background-color: var(--ev-bg-primary);
    box-shadow: var(--ev-elevation-lg);
    overflow-y: auto;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: calc(var(--ev-focus-ring-offset) * -1);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);
  }

  &__description {
    margin: 0;
    color: var(--ev-text-secondary);
  }

  &__media {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--ev-alert-dialog-media-fg);
  }

  &__actions {
    display: flex;
    gap: var(--ev-spacing-sm);
  }

  &__panel--desktop {
    max-width: 500px;
    padding: var(--ev-spacing-xl) var(--ev-spacing-lg);

    .ev-alert-dialog__media {
      align-self: center;
      width: 180px;
      height: 180px;

      svg {
        width: 96px;
        height: 96px;
      }
    }

    .ev-alert-dialog__title {
      @include type.style('subheading/h5');
    }

    .ev-alert-dialog__description {
      @include type.style('body/regular');
    }

    .ev-alert-dialog__actions {
      align-self: flex-end;
    }
  }

  /* The mobile board: icon tile, tighter type, stacked full-width buttons. */
  &__panel--compact {
    max-width: 296px;
    padding: var(--ev-spacing-lg);

    .ev-alert-dialog__media {
      width: 40px;
      height: 40px;
      border-radius: var(--ev-radius-md);
      background-color: var(--ev-alert-dialog-media-bg);

      svg {
        width: 24px;
        height: 24px;
      }
    }

    .ev-alert-dialog__title {
      @include type.style('subheading/h6');
    }

    .ev-alert-dialog__description {
      @include type.style('body/small');
    }

    .ev-alert-dialog__actions {
      flex-direction: column;

      > * {
        width: 100%;
      }
    }
  }

  &__panel--success {
    --ev-alert-dialog-media-bg: var(--ev-ext-success-subtler);
    --ev-alert-dialog-media-fg: var(--ev-ext-success);
  }

  &__panel--warning {
    --ev-alert-dialog-media-bg: var(--ev-ext-warning-subtler);
    --ev-alert-dialog-media-fg: var(--ev-ext-warning);
  }

  &__panel--info {
    --ev-alert-dialog-media-bg: var(--ev-ext-info-subtler);
    --ev-alert-dialog-media-fg: var(--ev-ext-info);
  }

  &__panel--delete {
    --ev-alert-dialog-media-bg: var(--ev-ext-error-subtler);
    --ev-alert-dialog-media-fg: var(--ev-ext-error);
  }

  /* Confirmation is the neutral one - it asks rather than reports. */
  &__panel--confirmation {
    --ev-alert-dialog-media-bg: var(--ev-bg-subtle);
    --ev-alert-dialog-media-fg: var(--ev-icon-primary);
  }
}
</style>
