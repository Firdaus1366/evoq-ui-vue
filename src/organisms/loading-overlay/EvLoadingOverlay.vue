<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import type { LoadingOverlayMode } from '../../types'
import EvLoading from '../../atoms/loading/EvLoading.vue'

/*
 * A full-page loading state, ported from the product's `UiLoading.vue`: the
 * EVOQ wordmark drawn as five outlined paths that trace themselves in turn.
 *
 *   blocked  fixed inset-0, centred, z 9999 - an 80% black scrim over the
 *            whole page, the logo loader on top. Nothing behind it can be
 *            reached: this is the mode that stops the user.
 *   popup    a small centred card holding the Loading spinner. There is no
 *            scrim and the layer takes no pointer events, so the page behind
 *            stays usable.
 *
 * The blocked mode is copied exactly - the SVG paths, the 280px / 70vw box,
 * the 2.8s `cubic-bezier(0.4, 0, 0.2, 1)` trace with its 0.15s stagger, the
 * white 4px round stroke and the `bg-black/80` scrim. Those are literals on
 * purpose: a blocking scrim reads the same in light and dark, so it does not
 * follow the theme tokens. Only the class names carry the `ev-` prefix.
 */

defineOptions({
  name: 'EvLoadingOverlay',
})

const props = withDefaults(
  defineProps<{
    /** Whether the loader is on screen. */
    modelValue?: boolean
    /** `blocked` covers and blocks the page; `popup` is a small card that does not. */
    mode?: LoadingOverlayMode
    /** Announced to assistive tech, and shown in the popup card. */
    label?: string
    /**
     * Escape turns it off (`update:modelValue` false). Off by default - a blocked
     * loader is meant to stop the user; this is the way out for a playground or
     * a stuck request.
     */
    closeOnEscape?: boolean
  }>(),
  {
    modelValue: false,
    mode: 'blocked',
    label: 'Memuat...',
    closeOnEscape: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function onKey(event: KeyboardEvent) {
  if (props.closeOnEscape && event.key === 'Escape') emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="ev-loading-overlay"
      :class="`ev-loading-overlay--${mode}`"
      :aria-busy="true"
    >
      <!-- Logo Outline Loading -->
      <div
        v-if="mode === 'blocked'"
        class="ev-loading-overlay__logo"
        :aria-label="label"
        role="status"
      >
        <svg
          class="ev-loading-overlay__logo-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 440.11 106.06"
        >
          <path
            class="ev-loading-overlay__logo-path"
            pathLength="1000"
            d="m6,96.79c-2.21,0-4-1.79-4-4V7.69c0-2.21,1.79-4,4-4h56.91c2.21,0,4,1.79,4,4v10.27c0,2.21-1.79,4-4,4H24.5v19.09h35.09c2.21,0,4,1.79,4,4v10.32c0,2.21-1.79,4-4,4H24.5v19.14h38.41c2.21,0,4,1.79,4,4v10.27c0,2.21-1.79,4-4,4H6Z"
          />
          <path
            class="ev-loading-overlay__logo-path"
            pathLength="1000"
            d="m99.17,3.69c1.76,0,3.31,1.15,3.83,2.83l19.95,65.35h.77L143.68,6.53c.51-1.68,2.07-2.83,3.83-2.83h16.65c2.74,0,4.67,2.69,3.79,5.28l-28.71,85.09c-.55,1.63-2.07,2.72-3.79,2.72h-24.21c-1.72,0-3.24-1.1-3.79-2.72L78.73,8.97c-.88-2.59,1.05-5.28,3.79-5.28h16.65Z"
          />
          <path
            class="ev-loading-overlay__logo-path"
            pathLength="1000"
            d="m256.2,24.19c-3.94-7.12-9.27-12.53-16-16.23-6.7-3.7-14.21-5.55-22.55-5.55s-15.89,1.85-22.59,5.55c-6.7,3.7-12.01,9.11-15.95,16.23-3.91,7.12-5.86,15.8-5.86,26.05s1.95,18.88,5.86,26c3.94,7.09,9.26,12.5,15.95,16.23,6.7,3.73,14.23,5.59,22.59,5.59s15.85-1.85,22.55-5.54c6.73-3.7,12.06-9.11,16-16.23,3.94-7.12,5.91-15.8,5.91-26.05s-1.97-18.92-5.91-26.05Zm-19.68,41.41c-1.7,4.18-4.15,7.35-7.36,9.5-3.18,2.15-7.02,3.23-11.5,3.23s-8.29-1.08-11.5-3.23c-3.21-2.15-5.68-5.32-7.41-9.5-1.7-4.18-2.55-9.3-2.55-15.36s.85-11.18,2.55-15.36c1.73-4.18,4.2-7.35,7.41-9.5,3.21-2.15,7.05-3.23,11.5-3.23s8.32,1.08,11.5,3.23c3.21,2.15,5.67,5.32,7.36,9.5,1.73,4.18,2.59,9.3,2.59,15.36s-.86,11.18-2.59,15.36Z"
          />
          <path
            class="ev-loading-overlay__logo-path"
            pathLength="1000"
            d="m348.74,87.11c3.31-3.01,6.14-6.61,8.47-10.83,3.94-7.12,5.91-15.8,5.91-26.05s-1.97-18.92-5.91-26.05c-3.94-7.12-9.27-12.53-16-16.23-6.7-3.7-14.21-5.55-22.54-5.55s-15.89,1.85-22.59,5.55c-6.7,3.7-12.01,9.11-15.95,16.23-3.91,7.12-5.86,15.8-5.86,26.05s1.95,18.88,5.86,26c3.94,7.09,9.26,12.5,15.95,16.23,6.7,3.73,14.23,5.59,22.59,5.59,5.79,0,11.18-.91,16.18-2.7l7.27,8.7h11.97c3.37,0,5.23-3.91,3.11-6.52l-8.45-10.43Zm-41.58-12.01c-3.21-2.15-5.68-5.32-7.41-9.5-1.7-4.18-2.55-9.3-2.55-15.36s.85-11.18,2.55-15.36c1.73-4.18,4.2-7.35,7.41-9.5,3.21-2.15,7.04-3.23,11.5-3.23s8.32,1.08,11.5,3.23c3.21,2.15,5.67,5.32,7.36,9.5,1.73,4.18,2.59,9.3,2.59,15.36s-.86,11.18-2.59,15.36c-.77,1.89-1.7,3.56-2.77,5.04l-5.73-7.31h-10.15c-3.3,0-5.18,3.78-3.19,6.41l6.32,8.37c-1.07.14-2.19.22-3.35.22-4.46,0-8.29-1.08-11.5-3.23Z"
          />
          <path
            class="ev-loading-overlay__logo-path"
            pathLength="1000"
            d="m434.11,22.91h-16.91V6c0-2.21-1.79-4-4-4h-8.14c-2.21,0-4,1.79-4,4v16.91h-16.95c-2.21,0-4,1.79-4,4v8.18c0,2.21,1.79,4,4,4h16.95v16.91c0,2.21,1.79,4,4,4h8.14c2.21,0,4-1.79,4-4v-16.91h16.91c2.21,0,4-1.79,4-4v-8.18c0-2.21-1.79-4-4-4Z"
          />
        </svg>
      </div>

      <div v-else class="ev-loading-overlay__card">
        <EvLoading type="spinner" :label="label" />
        <span class="ev-loading-overlay__text">{{ label }}</span>
      </div>

      <!-- Backdrop -->
      <div v-if="mode === 'blocked'" class="ev-loading-overlay__backdrop" />
    </div>
  </Teleport>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/* fixed inset-0 flex items-center justify-center, z-index 9999 */
.ev-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  /* absolute inset-0 bg-black/80 */
  &__backdrop {
    position: absolute;
    inset: 0;
    background-color: rgb(0 0 0 / 80%);
  }

  /* Popup: the layer lets clicks through, only the card is drawn. */
  &--popup {
    pointer-events: none;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-md);
    padding: var(--ev-spacing-lg);
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-bg-primary);
    box-shadow: var(--ev-elevation-lg);
    color: var(--ev-text-primary);
    pointer-events: auto;

    @include type.style('body/regular');
  }
}

.ev-loading-overlay__logo {
  position: relative;
  z-index: 10;
  width: 280px;
  max-width: 70vw;
  aspect-ratio: 440.11 / 106.06;
}

.ev-loading-overlay__logo-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.ev-loading-overlay__logo-path {
  fill: none;
  stroke: #ffffff;
  stroke-width: 4px;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 320 680;
  stroke-dashoffset: 0;
  animation: ev-loading-overlay-trace 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  will-change: stroke-dashoffset;
}

.ev-loading-overlay__logo-path:nth-child(2) {
  animation-delay: 0.15s;
}

.ev-loading-overlay__logo-path:nth-child(3) {
  animation-delay: 0.3s;
}

.ev-loading-overlay__logo-path:nth-child(4) {
  animation-delay: 0.45s;
}

.ev-loading-overlay__logo-path:nth-child(5) {
  animation-delay: 0.6s;
}

@keyframes ev-loading-overlay-trace {
  0% {
    stroke-dashoffset: 0;
    opacity: 0.35;
  }

  40% {
    opacity: 1;
  }

  100% {
    stroke-dashoffset: -1000;
    opacity: 0.35;
  }
}
</style>
