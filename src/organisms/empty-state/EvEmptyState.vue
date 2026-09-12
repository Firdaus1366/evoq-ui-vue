<script setup lang="ts">
import { computed } from 'vue'
import EvButton from '../../atoms/button/EvButton.vue'
import type { EmptyStateSize, EmptyStateVariant } from '../../types'

defineOptions({
  name: 'EvEmptyState',
  inheritAttrs: false,
})

/**
 * The copy the board writes into each variant. `inline` marks the two that
 * sit inside a table or a card: they draw a caption and no button at all.
 */
const PRESETS: Record<
  EmptyStateVariant,
  { title: string; description?: string; action?: string; inline?: boolean }
> = {
  '400': {
    title: 'Oops! Something Went Wrong',
    description: 'We couldn’t process your request. Please try again later.',
    action: 'Reload',
  },
  '401': {
    title: 'No Unauthorized Access',
    description:
      "We couldn't verify your credentials. Please check your login details and try again.",
    action: 'Go Back',
  },
  '404': {
    title: "This Page isn't Available",
    description:
      "We couldn't find the page you're looking for. It may have been moved or no longer exists.",
    action: 'Go Back',
  },
  '500': {
    title: 'This Page Isn’t Working',
    description:
      'We apologize for the inconvenience, we are currently working on repairs. Please return in a moment.',
    action: 'Reload',
  },
  maintenance: {
    title: 'This Page Is Under Maintenance',
    description: 'We are improving this page, and will be back soon! You can explore other page.',
    action: 'Go Back',
  },
  'no-data': { title: 'There’s no data yet.', inline: true },
  'no-result': { title: 'No result found.', inline: true },
}

const props = withDefaults(
  defineProps<{
    /** `Variant` of the Figma `D - Empty State` / `M - Empty State` sets. */
    variant?: EmptyStateVariant
    /** Which of the two sets to follow: the desktop one or the mobile one. */
    size?: EmptyStateSize
    /** Overrides the variant's headline. */
    title?: string
    /** Overrides the variant's supporting line. */
    description?: string
    /** The third line, which the board fills with a system error code. */
    errorMessage?: string
    /** Overrides the variant's button label. Set to '' to drop the button. */
    actionLabel?: string
  }>(),
  {
    variant: '404',
    size: 'desktop',
    title: undefined,
    description: undefined,
    errorMessage: undefined,
    actionLabel: undefined,
  },
)

const emit = defineEmits<{
  action: []
}>()

const slots = defineSlots<{
  /** The centre of the illustration, inside the board's rings. */
  illustration?: () => unknown
  /** Replaces the button entirely. */
  action?: () => unknown
}>()

const preset = computed(() => PRESETS[props.variant])
const inline = computed(() => Boolean(preset.value.inline))
const resolvedTitle = computed(() => props.title ?? preset.value.title)
const resolvedDescription = computed(() => props.description ?? preset.value.description)
const resolvedAction = computed(() => props.actionLabel ?? preset.value.action)
/** 400 and 401 draw a fourth ring; 404, 500 and Under Maintenance draw three. */
const rings = computed(() => (props.variant === '400' || props.variant === '401' ? 4 : 3))
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-empty-state"
    :class="[`ev-empty-state--${size}`, inline ? 'ev-empty-state--inline' : 'ev-empty-state--page']"
  >
    <div class="ev-empty-state__illustration" aria-hidden="true">
      <span v-for="ring in inline ? 0 : rings" :key="ring" class="ev-empty-state__ring" />
      <span class="ev-empty-state__art">
        <slot name="illustration">
          <svg viewBox="0 0 92 98" focusable="false">
            <rect x="2.5" y="3" width="87" height="92" rx="8" class="ev-empty-state__sheet" />
            <path d="M22 34h48M22 48h48M22 62h30" class="ev-empty-state__lines" />
          </svg>
          <span class="ev-empty-state__badge">
            <svg viewBox="0 0 14 14" focusable="false">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </span>
        </slot>
      </span>
    </div>

    <div class="ev-empty-state__copy">
      <p class="ev-empty-state__title">{{ resolvedTitle }}</p>
      <p v-if="resolvedDescription" class="ev-empty-state__description">
        {{ resolvedDescription }}
      </p>
      <p v-if="errorMessage" class="ev-empty-state__error">{{ errorMessage }}</p>
    </div>

    <div v-if="slots.action" class="ev-empty-state__action"><slot name="action" /></div>
    <EvButton
      v-else-if="!inline && resolvedAction"
      class="ev-empty-state__button"
      variant="secondary-light"
      :block="size === 'mobile'"
      @click="emit('action')"
    >
      {{ resolvedAction }}
    </EvButton>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `D - Empty State` and `M - Empty State` component sets on
 * the Empty page (7 Variants each).
 *
 * Node tree, in board order (D, page variants):
 *   Variant=404       VERTICAL, gap 12, centred, 400 wide
 *     <name>          the 226 illustration group
 *       Ellipse 4/3/2/5  concentric rings at 226 / 205 / 169 / 135, each a
 *                     0.5px border/primary stroke. 400 and 401 draw all four;
 *                     404, 500 and Under Maintenance drop the innermost
 *       <art>         the per-variant centrepiece
 *       <badge>       22px brand/primary disc, 13px glyph
 *     Wrapper Desc    VERTICAL, gap 8, centred
 *       Title         16 Bold / 20, text/primary
 *       Description   14 Medium, text/secondary
 *       Error         14 Medium, text/tertiary
 *     Button          a secondary-light Button instance, default size
 *
 * The two inline variants (No Data, No Result) are a different shape:
 * VERTICAL gap 16, padding 8, a 92x98 illustration and a single 14 Medium
 * text/secondary caption. No rings, no title / description split, no button.
 *
 * M differs from D in four measured ways, and in nothing else: the rings are
 * 180 instead of 226, the title is 14 Bold instead of 16 Bold / 20, Wrapper
 * Desc uses gap 12 instead of 8 inside a 24px side inset, and the Button
 * fills the width.
 *
 * Deviation: the per-variant centrepiece is bespoke vector art - a browser
 * chrome for 404, a lock and dots for 401, three stacked notification cards
 * for 500. Artwork is not layout, so the rings, the sizes, the brand badge
 * and the copy are traced and the centre is a slot with a neutral default
 * sheet. Pass the real drawing through `#illustration`.
 */
.ev-empty-state {
  --ev-empty-state-rings: 226px;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ev-spacing-md);

  &--mobile {
    --ev-empty-state-rings: 180px;
  }

  &__illustration {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ev-empty-state-rings);
    height: var(--ev-empty-state-rings);
  }

  /* Four rings at 100 / 90.7 / 74.8 / 59.7 percent of the group - 226, 205, 169, 135. */
  &__ring {
    position: absolute;
    border: 0.5px solid var(--ev-border-primary);
    border-radius: var(--ev-radius-rd);

    &:nth-child(1) {
      width: 100%;
      height: 100%;
    }

    &:nth-child(2) {
      width: 90.7%;
      height: 90.7%;
    }

    &:nth-child(3) {
      width: 74.8%;
      height: 74.8%;
    }

    &:nth-child(4) {
      width: 59.7%;
      height: 59.7%;
    }
  }

  &__art {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 92px;
      height: 98px;
    }
  }

  &__sheet {
    fill: var(--ev-bg-secondary);
    stroke: var(--ev-border-primary);
    stroke-width: 0.5;
  }

  &__lines {
    fill: none;
    stroke: var(--ev-border-primary);
    stroke-width: 3;
    stroke-linecap: round;
  }

  /* The 22px brand disc every page variant pins to its illustration. */
  &__badge {
    position: absolute;
    right: 0;
    bottom: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-brand-primary);

    svg {
      width: 13px;
      height: 13px;
      fill: none;
      stroke: var(--ev-text-inverse);
      stroke-width: 2;
      stroke-linecap: round;
    }
  }

  &__copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--ev-spacing-sm);
    text-align: center;
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('subheading/h6');
  }

  &__description {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }

  &__error {
    margin: 0;
    color: var(--ev-text-tertiary);

    @include type.style('body/regular');
  }

  &--mobile &__copy {
    gap: var(--ev-spacing-md);
    padding-inline: var(--ev-spacing-xl);
  }

  &--mobile &__title {
    @include type.style('body/regular-b');
  }

  /* Variant=No Data / No Result - a caption inside a card or a table. */
  &--inline {
    gap: var(--ev-spacing-lg);
    padding: var(--ev-spacing-sm);
  }

  &--inline &__illustration {
    width: 92px;
    height: 98px;
  }

  &--inline &__title {
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }
}
</style>
