<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AvatarSize, AvatarVariant } from '../../types'

defineOptions({
  name: 'EvAvatar',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    size?: AvatarSize
    /**
     * Tint of the initials avatar, or one of the three grey states: `number`
     * for an overflow count, `empty` for no person, `error` for a failed image.
     */
    variant?: AvatarVariant
    /** Initials, or the count for the `number` variant. */
    label?: string
    /** Shows the photo instead of the initials. */
    src?: string
    /** Accessible name. Falls back to the initials. */
    alt?: string
  }>(),
  {
    size: 32,
    variant: 'blue',
    label: undefined,
    src: undefined,
    alt: undefined,
  },
)

defineSlots<{
  /** Replaces the whole face - use for a custom glyph. */
  default?: () => unknown
}>()

const failed = ref(false)

// A new photo deserves a fresh attempt, even if the last one failed.
watch(
  () => props.src,
  () => (failed.value = false),
)

const showImage = computed(() => Boolean(props.src) && !failed.value)

/**
 * A broken photo falls back to the board's own `error` variant rather than
 * leaving a hole, which is exactly what that variant is drawn for.
 */
const resolvedVariant = computed(() => (props.src && failed.value ? 'error' : props.variant))
</script>

<template>
  <span
    v-bind="$attrs"
    class="ev-avatar"
    :class="[`ev-avatar--${size}`, `ev-avatar--${resolvedVariant}`]"
    :role="alt || label ? 'img' : undefined"
    :aria-label="alt ?? label"
  >
    <img
      v-if="showImage"
      class="ev-avatar__image"
      :src="src"
      :alt="alt ?? ''"
      @error="failed = true"
    />

    <template v-else-if="$slots.default"><slot /></template>

    <svg
      v-else-if="resolvedVariant === 'empty'"
      class="ev-avatar__glyph"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="5.5" r="2.75" stroke="currentColor" stroke-width="1.3" fill="none" />
      <path
        d="M2.75 14a5.25 5.25 0 0110.5 0"
        stroke="currentColor"
        stroke-width="1.3"
        fill="none"
        stroke-linecap="round"
      />
    </svg>

    <svg
      v-else-if="resolvedVariant === 'error'"
      class="ev-avatar__glyph"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="1.5"
        stroke="currentColor"
        stroke-width="1.3"
        fill="none"
      />
      <path d="M2.5 12l3.5-3.5 2.5 2.5" stroke="currentColor" stroke-width="1.3" fill="none" />
      <path d="M2 2l12 12" stroke="currentColor" stroke-width="1.3" />
    </svg>

    <span v-else class="ev-avatar__label">{{ label }}</span>
  </span>
</template>

<style lang="scss">
/*
 * Traced from the `Avatar` component set in Figma (108 variants: Size x
 * Variant x Has Image).
 *
 * OFF-SYSTEM COLOURS: the six tinted variants are radial gradients whose stops
 * are in no EVOQ ramp. They are reproduced as drawn and held in one property
 * each, so the day they enter the token system there is one place to change.
 * The three grey states (`number`, `empty`, `error`) do use tokens.
 */
.ev-avatar {
  --ev-avatar-bg: radial-gradient(circle, #dff1ff, #93c6ef);
  --ev-avatar-fg: var(--ev-text-inverse);
  --ev-avatar-size: 32px;
  --ev-avatar-font: var(--ev-font-size-sm);
  --ev-avatar-line: var(--ev-line-height-xs);
  --ev-avatar-glyph: 16px;

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--ev-avatar-size);
  height: var(--ev-avatar-size);
  border-radius: var(--ev-radius-rd);
  background: var(--ev-avatar-bg);
  color: var(--ev-avatar-fg);
  overflow: hidden;

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__glyph {
    width: var(--ev-avatar-glyph);
    height: var(--ev-avatar-glyph);
  }

  &__label {
    font-family: var(--ev-font-family-base);
    font-size: var(--ev-avatar-font);
    line-height: var(--ev-avatar-line);
    font-weight: var(--ev-font-weight-medium);
    user-select: none;
  }

  /* Sizes - the type scale steps with the circle. */
  &--24 {
    --ev-avatar-size: 24px;
    --ev-avatar-font: var(--ev-font-size-2xs);
    --ev-avatar-line: var(--ev-line-height-xs);
  }

  &--32 {
    --ev-avatar-size: 32px;
    --ev-avatar-font: var(--ev-font-size-sm);
    --ev-avatar-line: var(--ev-line-height-xs);
  }

  &--40 {
    --ev-avatar-size: 40px;
    --ev-avatar-font: var(--ev-font-size-md);
    --ev-avatar-line: var(--ev-line-height-sm);
  }

  &--48 {
    --ev-avatar-size: 48px;
    --ev-avatar-font: var(--ev-font-size-xl);
    --ev-avatar-line: var(--ev-line-height-md);
    --ev-avatar-glyph: 24px;
  }

  &--64 {
    --ev-avatar-size: 64px;
    --ev-avatar-font: var(--ev-font-size-3xl);
    --ev-avatar-line: var(--ev-line-height-xl);
    --ev-avatar-glyph: 32px;
  }

  &--96 {
    --ev-avatar-size: 96px;
    --ev-avatar-font: var(--ev-font-size-5xl);
    --ev-avatar-line: var(--ev-line-height-4xl);
    --ev-avatar-glyph: 48px;
  }

  /* Tints (off-system gradients) */
  &--green {
    --ev-avatar-bg: radial-gradient(circle, #f3ffe8, #89ae68);
  }

  &--blue {
    --ev-avatar-bg: radial-gradient(circle, #dff1ff, #93c6ef);
  }

  &--orange {
    --ev-avatar-bg: radial-gradient(circle, #ffdbc0, #fc7b1f);
  }

  &--purple {
    --ev-avatar-bg: radial-gradient(circle, #e0d4fd, #8873bd);
  }

  &--teal {
    --ev-avatar-bg: radial-gradient(circle, #e7eaea, #2fa0a1);
  }

  &--pink {
    --ev-avatar-bg: radial-gradient(circle, #ffe6ed, #f37a98);
  }

  /* The three grey states share a surface and differ only in what they show. */
  &--number {
    --ev-avatar-bg: var(--ev-bg-subtler);
    --ev-avatar-fg: var(--ev-text-secondary);
  }

  &--empty,
  &--error {
    --ev-avatar-bg: var(--ev-bg-subtler);
    --ev-avatar-fg: var(--ev-icon-secondary);
  }
}
</style>
