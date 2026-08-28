<script setup lang="ts">
import { ref, toRef, useId } from 'vue'
import { useOverlay } from '../../composables/useOverlay'
import type { DrawerPlacement, DrawerSize } from '../../types'

defineOptions({
  name: 'EvDrawer',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    size?: DrawerSize
    /** Which edge it slides from. `bottom` is the board's mobile sheet. */
    placement?: DrawerPlacement
    title?: string
    subtext?: string
    closable?: boolean
    closeLabel?: string
    closeOnScrim?: boolean
  }>(),
  {
    modelValue: false,
    size: 'default',
    placement: 'right',
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
  default?: () => unknown
  title?: () => unknown
  subtext?: () => unknown
  /** Figma's `Top Slot` - a control beside the close button. */
  topSlot?: () => unknown
  footer?: () => unknown
}>()

const panel = ref<HTMLElement | null>(null)
const titleId = `ev-drawer-title-${useId()}`

function close() {
  emit('update:modelValue', false)
  emit('close')
}

useOverlay({ open: toRef(props, 'modelValue'), panel, onEscape: close })
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ev-drawer" :class="`ev-drawer--${placement}`">
      <div class="ev-drawer__scrim" @click="closeOnScrim && close()" />

      <div
        ref="panel"
        v-bind="$attrs"
        class="ev-drawer__panel"
        :class="`ev-drawer__panel--${size}`"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title || $slots.title ? titleId : undefined"
        tabindex="-1"
      >
        <!-- The bottom sheet is dragged by a grab handle rather than closed
             from a corner, which is why it only appears on that placement. -->
        <span v-if="placement === 'bottom'" class="ev-drawer__thumb" aria-hidden="true" />

        <div class="ev-drawer__header">
          <div class="ev-drawer__heading">
            <p :id="titleId" class="ev-drawer__title">
              <slot name="title">{{ title }}</slot>
            </p>
            <p v-if="subtext || $slots.subtext" class="ev-drawer__subtext">
              <slot name="subtext">{{ subtext }}</slot>
            </p>
          </div>

          <slot name="topSlot" />

          <button
            v-if="closable"
            type="button"
            class="ev-drawer__close"
            :aria-label="closeLabel"
            @click="close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" fill="none" />
            </svg>
          </button>
        </div>

        <div class="ev-drawer__content"><slot /></div>

        <div v-if="$slots.footer" class="ev-drawer__footer"><slot name="footer" /></div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `D- Drawer` component set (Default 400px, Wide 700px) and
 * the standalone `M- Drawer` bottom sheet.
 *
 * Unlike the modal, every band here is white - the header and footer are
 * separated by rules rather than by a change of surface, and only the content
 * between them scrolls.
 */
.ev-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--ev-z-modal);
  display: flex;

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
    background-color: var(--ev-bg-primary);

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: calc(var(--ev-focus-ring-offset) * -1);
    }
  }

  /* The shadow points away from the edge the panel is anchored to. */
  &--right {
    justify-content: flex-end;

    .ev-drawer__panel {
      width: 100%;
      height: 100%;
      box-shadow: -8px 0 24px 0 rgb(var(--ev-shadow-tint) / 0.15);
    }
  }

  &--left {
    justify-content: flex-start;

    .ev-drawer__panel {
      width: 100%;
      height: 100%;
      box-shadow: 8px 0 24px 0 rgb(var(--ev-shadow-tint) / 0.15);
    }
  }

  &--bottom {
    align-items: flex-end;

    .ev-drawer__panel {
      width: 100%;
      max-width: none;
      max-height: 80vh;
      padding-top: var(--ev-spacing-xl);
      border-radius: var(--ev-radius-md) var(--ev-radius-md) 0 0;
      box-shadow: 0 -4px 24px 0 rgb(var(--ev-shadow-tint) / 0.15);
    }

    .ev-drawer__header {
      padding: 0 var(--ev-spacing-lg) var(--ev-spacing-lg);
    }

    .ev-drawer__content,
    .ev-drawer__footer {
      padding-right: var(--ev-spacing-lg);
      padding-left: var(--ev-spacing-lg);
    }
  }

  &--right .ev-drawer__panel--default,
  &--left .ev-drawer__panel--default {
    max-width: 400px;
  }

  &--right .ev-drawer__panel--wide,
  &--left .ev-drawer__panel--wide {
    max-width: 700px;
  }

  &__thumb {
    align-self: center;
    width: 60px;
    height: 4px;
    margin-bottom: var(--ev-spacing-lg);
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-bg-subtlest);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: var(--ev-spacing-xs);
    padding: var(--ev-spacing-xl) var(--ev-spacing-xl) var(--ev-spacing-lg);
    border-bottom: var(--ev-stroke-xs) solid var(--ev-border-primary);
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    flex: 1;
    min-width: 0;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-secondary);
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

  /* Only this band scrolls, so the header and footer stay put. */
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
    flex: 1;
    padding: var(--ev-spacing-lg) var(--ev-spacing-xl);
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    padding: var(--ev-spacing-lg) var(--ev-spacing-xl) var(--ev-spacing-xl);
    border-top: var(--ev-stroke-xs) solid var(--ev-border-primary);
  }
}
</style>
