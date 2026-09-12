<script setup lang="ts">
import { computed, useId, useSlots } from 'vue'
import type { LogoBrand, LogoVariant } from '../../types'
import { LOCKUPS } from './lockups'

defineOptions({
  name: 'EvLogo',
  inheritAttrs: false,
})

/*
 * Both brand lockups from the Figma `Logo` page, drawn part by part from the
 * SVG this folder ships - see `lockups.ts` for the geometry and where it comes
 * from. A local asset (`src`, or the default slot) replaces them.
 */

const props = withDefaults(
  defineProps<{
    /** Which lockup: the EVOQ product logo, or the DataSea company logo. */
    brand?: LogoBrand
    /** The whole lockup, or one part of it on its own. */
    variant?: LogoVariant
    /** Rendered height, in px for a number. The width follows the lockup. */
    size?: number | string
    /**
     * An image to use instead of the built-in logo - a local asset, or any
     * URL. Leave it unset and the component draws the Figma logo.
     */
    src?: string
    /**
     * Accessible name. Defaults to the brand's name; set it to an empty
     * string for a logo that is purely decorative.
     */
    label?: string
    /**
     * Draw the "Procure to Pay Evolution" line under the wordmark. Only the
     * EVOQ lockup has one; DataSea ignores it.
     */
    tagline?: boolean
  }>(),
  {
    brand: 'evoq',
    variant: 'lockup',
    size: 40,
    src: undefined,
    label: undefined,
    tagline: true,
  },
)

defineSlots<{
  /**
   * Replaces the logo entirely - for a lockup this package does not ship,
   * such as a co-branded one. Takes precedence over `src`.
   */
  default?: () => unknown
}>()

const spec = computed(() => LOCKUPS[props.brand])
const name = computed(() => props.label ?? (props.brand === 'evoq' ? 'EVOQ' : 'DataSea'))

/** The parts this variant draws, each already positioned for its own frame. */
const parts = computed(() => {
  const { mark, wordmark, tagline } = spec.value.parts
  if (props.variant === 'mark') return [{ key: 'mark', ...mark, x: 0, y: 0 }]
  if (props.variant === 'wordmark') return [{ key: 'wordmark', ...wordmark, x: 0, y: 0 }]

  const out = [
    { key: 'mark', ...mark },
    { key: 'wordmark', ...wordmark },
  ]
  if (props.tagline && tagline) out.push({ key: 'tagline', ...tagline })
  return out
})

/** The box the parts are laid out in: the lockup, or the part's own bounds. */
const frame = computed(() => {
  if (props.variant === 'lockup') return spec.value.frame
  const part = props.variant === 'mark' ? spec.value.parts.mark : spec.value.parts.wordmark
  return { w: part.w, h: part.h }
})

const em = (value: number) => `${+(value / frame.value.h).toFixed(4)}em`

/** One `size` scales everything: it is the font-size the parts are drawn in. */
const slots = useSlots()
/** An override sizes itself from the height alone; the built-in logo gets its box. */
const isOverridden = computed(() => Boolean(slots.default || props.src))
const rootStyle = computed(() => ({
  fontSize: typeof props.size === 'number' ? `${props.size}px` : props.size,
  ...(isOverridden.value ? {} : { width: em(frame.value.w), height: '1em' }),
}))

const partStyle = (part: { x: number; y: number; w: number; h: number }) => ({
  left: em(part.x),
  top: em(part.y),
  width: em(part.w),
  height: em(part.h),
})

/*
 * The exported SVGs carry Figma's gradient ids. Two logos on one page would
 * repeat them, so each instance gets its own suffix - otherwise the browser
 * resolves every `url(#…)` to whichever logo rendered first.
 */
const uid = useId()
const scopedSvg = (svg: string) =>
  svg.replace(/(id="|url\(#)([\w-]+)/g, (_match, lead: string, id: string) => `${lead}${id}-${uid}`)
</script>

<template>
  <span
    v-bind="$attrs"
    class="ev-logo"
    :class="[`ev-logo--${brand}`, `ev-logo--${variant}`]"
    :style="rootStyle"
    :role="$slots.default || !name ? undefined : 'img'"
    :aria-label="$slots.default || !name ? undefined : name"
    :aria-hidden="!$slots.default && !name ? 'true' : undefined"
  >
    <slot>
      <!-- A local asset wins over the Figma logo; without one, the logo ships. -->
      <img v-if="src" class="ev-logo__image" :src="src" :alt="name" />

      <!-- eslint-disable vue/no-v-html -- our own SVG, inlined at build time -->
      <span
        v-for="part in parts"
        v-else
        :key="part.key"
        class="ev-logo__part"
        :class="`ev-logo__${part.key}`"
        :style="partStyle(part)"
        v-html="scopedSvg(part.svg)"
      />
      <!-- eslint-enable vue/no-v-html -->
    </slot>
  </span>
</template>

<style lang="scss">
/*
 * The logo's colours are literal hexes, not tokens, and deliberately so: a
 * logo must not re-theme with the brand or the colour scheme.
 */
.ev-logo {
  position: relative;
  display: inline-block;
  flex-shrink: 0;
  line-height: 0;

  &__part {
    position: absolute;
    display: block;

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  }

  /* An image override is sized by height alone, so any lockup ratio fits. */
  &__image {
    display: block;
    width: auto;
    height: 1em;
  }
}
</style>
