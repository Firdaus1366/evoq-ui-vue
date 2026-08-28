<script setup lang="ts">
import { ref, toRef, useId } from 'vue'
import { useOverlay } from '../../composables/useOverlay'
import type { ModalSize } from '../../types'

defineOptions({
  name: 'EvModal',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    size?: ModalSize
    title?: string
    subtext?: string
    /** Renders the close button in the header. */
    closable?: boolean
    closeLabel?: string
    /** Set false to keep a click on the scrim from closing the modal. */
    closeOnScrim?: boolean
  }>(),
  {
    modelValue: false,
    size: 'small',
    title: undefined,
    subtext: undefined,
    closable: true,
    closeLabel: 'Tutup',
    closeOnScrim: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

defineSlots<{
  /** Body, between the header and the footer. */
  default?: () => unknown
  title?: () => unknown
  subtext?: () => unknown
  /** Figma's `Top Slot` - a row above the title. */
  topSlot?: () => unknown
  /** Leading footer content, such as a "don't show again" checkbox. */
  footerStart?: () => unknown
  footer?: () => unknown
}>()

const panel = ref<HTMLElement | null>(null)
const titleId = `ev-modal-title-${useId()}`

function close() {
  emit('update:modelValue', false)
  emit('close')
}

useOverlay({ open: toRef(props, 'modelValue'), panel, onEscape: close })
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ev-modal">
      <div class="ev-modal__scrim" @click="closeOnScrim && close()" />

      <div
        ref="panel"
        v-bind="$attrs"
        class="ev-modal__panel"
        :class="`ev-modal__panel--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title || $slots.title ? titleId : undefined"
        tabindex="-1"
      >
        <div class="ev-modal__header">
          <div v-if="$slots.topSlot" class="ev-modal__top-slot"><slot name="topSlot" /></div>

          <div class="ev-modal__heading">
            <p :id="titleId" class="ev-modal__title">
              <slot name="title">{{ title }}</slot>
            </p>
            <p v-if="subtext || $slots.subtext" class="ev-modal__subtext">
              <slot name="subtext">{{ subtext }}</slot>
            </p>
          </div>

          <div v-if="$slots.default" class="ev-modal__body"><slot /></div>

          <button
            v-if="closable"
            type="button"
            class="ev-modal__close"
            :aria-label="closeLabel"
            @click="close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" fill="none" />
            </svg>
          </button>
        </div>

        <div v-if="$slots.footer || $slots.footerStart" class="ev-modal__footer">
          <div v-if="$slots.footerStart" class="ev-modal__footer-start">
            <slot name="footerStart" />
          </div>
          <div class="ev-modal__footer-actions"><slot name="footer" /></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `D - Modal` component set in Figma (Small, Medium, Large).
 *
 * The panel is two bands: a white header holding the title, body and close
 * button, and a `bg/subtle` footer holding the actions. The scrim value comes
 * from the Pattern page, which draws it as `bg/overlay` at 80%.
 */
.ev-modal {
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
    position: relative;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-height: calc(100vh - var(--ev-spacing-2xl));
    border-radius: var(--ev-radius-md);
    background-color: var(--ev-bg-primary);
    box-shadow: var(--ev-elevation-lg);
    overflow: hidden;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: calc(var(--ev-focus-ring-offset) * -1);
    }

    &--small {
      max-width: 500px;
    }

    &--medium {
      max-width: 720px;
    }

    &--large {
      max-width: 1042px;
    }
  }

  &__header {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
    padding: var(--ev-spacing-lg);
    background-color: var(--ev-bg-primary);
    overflow-y: auto;
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    /* Keeps a long title clear of the close button. */
    padding-right: var(--ev-spacing-2xl);
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('subheading/h5');
  }

  &__subtext {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }

  &__close {
    position: absolute;
    top: var(--ev-spacing-lg);
    right: var(--ev-spacing-lg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-primary);
    cursor: pointer;

    svg {
      width: 24px;
      height: 24px;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  /* The footer is the only part of the panel that is not white. */
  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ev-spacing-sm);
    padding: var(--ev-spacing-lg);
    background-color: var(--ev-bg-subtle);
  }

  &__footer-start {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__footer-actions {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    margin-left: auto;
  }
}
</style>
