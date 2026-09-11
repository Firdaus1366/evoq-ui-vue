<script setup lang="ts">
defineOptions({
  name: 'EvLogo',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Rendered height. The mark is square, so this sets both dimensions. */
    size?: number | string
    /** Accessible name. Set to an empty string for a decorative mark. */
    label?: string
  }>(),
  {
    size: 32,
    label: 'EVOQ',
  },
)

defineSlots<{
  /**
   * The wordmark beside the mark. Not shipped - see the note in the style
   * block for why - so supply your own asset here when you need it.
   */
  default?: () => unknown
}>()
</script>

<template>
  <span v-bind="$attrs" class="ev-logo">
    <svg
      class="ev-logo__mark"
      :style="{
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }"
      viewBox="0 0 194 194"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      :role="label ? 'img' : undefined"
      :aria-label="label || undefined"
      :aria-hidden="label ? undefined : 'true'"
    >
      <circle cx="97" cy="97" r="97" fill="#3B82F6" />
      <path
        d="M98.5075 0.0117288C75.7134 -0.342567 53.5227 7.34276 35.8302 21.7189C18.1377 36.095 6.07397 56.2432 1.75606 78.6275C-2.56185 101.012 1.14193 124.202 12.2177 144.127C23.2935 164.053 41.0334 179.44 62.3238 187.59L67.6817 127.254L80.4695 92.6334L96.6881 49.2797L98.5075 0.0117288Z"
        fill="#0EA5E9"
      />
      <path
        d="M59.7141 7.45242C45.8754 13.2146 33.5605 22.1058 23.736 33.428C13.9116 44.7503 6.845 58.1955 3.09094 72.7083C-0.663114 87.221 -1.00246 102.406 2.09954 117.072C5.20154 131.738 11.6605 145.486 20.9693 157.236L45.537 87.643L59.7141 7.45242Z"
        fill="#06B6D4"
      />
      <path
        d="M122.086 3.2747C126.195 26.7803 124.618 58.6026 105.676 96.4879C87.3048 133.23 87.5361 162.473 91.9191 182.196C92.8915 186.573 94.0764 190.512 95.3272 193.986C95.8835 193.995 96.4412 194 97 194C150.572 194 194 150.572 194 97.0001C194 52.1031 163.498 14.3303 122.086 3.2747Z"
        fill="#F59E0B"
      />
      <path
        d="M85.4962 0.674637C90.1833 24.4106 89.2205 57.1874 69.5703 96.4879C51.1994 133.23 51.4308 162.473 55.8137 182.196C56.0397 183.214 56.2774 184.208 56.5247 185.178C62.1406 187.76 68.0459 189.821 74.1783 191.3C73.7563 189.72 73.3552 188.088 72.9808 186.404C67.6637 162.477 67.8946 128.67 88.3238 87.8122C106.695 51.0701 106.463 21.8269 102.08 2.10393C101.93 1.42833 101.775 0.762405 101.615 0.107651C100.086 0.0358733 98.5471 0 96.9999 0C93.1078 0 89.269 0.228928 85.4962 0.674637Z"
        fill="#3B82F6"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M34.4951 171.179C28.0378 165.732 22.3014 159.458 17.4497 152.519C18.4009 136.635 22.7959 117.826 33.4649 96.4879C50.2658 62.8851 53.4057 34.0519 51.0336 11.5609C55.965 8.90265 61.1526 6.65808 66.5502 4.87523C70.34 24.5226 69.7473 52.7535 52.2184 87.8123C35.8029 120.643 32.4287 148.921 34.4951 171.179Z"
        fill="#0EA5E9"
      />
      <path
        d="M32.3333 24.6991C12.4887 42.4603 0 68.2716 0 97.0001C0 105.437 1.07722 113.623 3.10148 121.426C5.98532 110.857 10.2043 99.6293 16.113 87.8123C28.4139 63.2101 32.3745 41.97 32.3333 24.6991Z"
        fill="#06B6D4"
      />
    </svg>

    <span v-if="$slots.default" class="ev-logo__wordmark"><slot /></span>
  </span>
</template>

<style lang="scss">
/*
 * The EVOQ mark, exported from the `Logo` page in Figma.
 *
 * WHY ONLY THE MARK: the board's full lockup exports to 107KB of SVG, because
 * the wordmark is outlined text - thousands of glyph paths. Inlining that in a
 * component library would cost more than every other component combined. The
 * mark alone is 2.2KB, so it ships; the wordmark belongs in the consuming app's
 * assets, and goes in the default slot.
 *
 * The mark's colours are literal hexes rather than tokens, deliberately: a logo
 * must not re-theme with the brand or the colour scheme.
 */
.ev-logo {
  display: inline-flex;
  align-items: center;
  gap: var(--ev-spacing-sm);

  &__mark {
    display: block;
    flex-shrink: 0;
  }

  &__wordmark {
    display: inline-flex;
    align-items: center;
    color: var(--ev-text-primary);
  }
}
</style>
