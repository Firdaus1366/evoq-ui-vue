<script setup lang="ts">
import { computed, useId } from 'vue'
import type { AccordionVariant } from '../../types'

defineOptions({
  name: 'EvAccordion',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    variant?: AccordionVariant
    disabled?: boolean
    title?: string
    subtext?: string
    /** Whether to show the bottom separator rule in the default variant. */
    separator?: boolean
  }>(),
  {
    modelValue: false,
    variant: 'default',
    disabled: false,
    title: undefined,
    subtext: undefined,
    separator: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  default?: () => unknown
  title?: () => unknown
  subtext?: () => unknown
}>()

const panelId = `ev-accordion-panel-${useId()}`
const headerId = `ev-accordion-header-${useId()}`

const expanded = computed(() => props.modelValue && !props.disabled)

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-accordion"
    :class="[
      `ev-accordion--${variant}`,
      { 'ev-accordion--expanded': expanded, 'ev-accordion--disabled': disabled },
    ]"
  >
    <button
      :id="headerId"
      type="button"
      class="ev-accordion__header"
      :aria-expanded="expanded"
      :aria-controls="panelId"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="ev-accordion__text">
        <span v-if="title || $slots.title" class="ev-accordion__title">
          <slot name="title">{{ title }}</slot>
        </span>
        <span v-if="subtext || $slots.subtext" class="ev-accordion__subtext">
          <slot name="subtext">{{ subtext }}</slot>
        </span>
      </span>

      <svg class="ev-accordion__chevron" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path
          d="M5.5 8L10 12.5 14.5 8"
          stroke="currentColor"
          stroke-width="1.6"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div
      v-show="expanded"
      :id="panelId"
      class="ev-accordion__panel"
      role="region"
      :aria-labelledby="headerId"
    >
      <slot />
    </div>

    <!--
      The `default` variant is separated by a rule beneath it; the `card`
      variant is separated by its own border, so it has no rule.
    -->
    <span v-if="variant === 'default' && separator" class="ev-accordion__rule" aria-hidden="true" />
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Accordion` component set in Figma (6 variants: Variant x
 * Disabled x Expanded).
 *
 * The two variants differ by more than a border: `card` promotes the title to
 * `subheading/h6` and shifts its header padding when open, so the content sits
 * closer to the header than the header does to the top edge.
 */
.ev-accordion {
  --ev-accordion-title: var(--ev-text-primary);
  --ev-accordion-subtext: var(--ev-text-secondary);
  --ev-accordion-chevron: var(--ev-icon-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-sm);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ev-spacing-sm);
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    min-width: 0;
  }

  &__title {
    color: var(--ev-accordion-title);

    @include type.style('body/regular');
  }

  &__subtext {
    color: var(--ev-accordion-subtext);

    @include type.style('body/small');
  }

  &__chevron {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: var(--ev-accordion-chevron);
    transition: transform var(--ev-duration-fast) var(--ev-easing-standard);
  }

  &__rule {
    display: block;
    height: var(--ev-stroke-xs);
    background-color: var(--ev-border-primary);
  }

  &--expanded &__chevron {
    transform: rotate(180deg);
  }

  &--card {
    gap: 0;
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-bg-primary);

    .ev-accordion__header {
      padding: var(--ev-spacing-md) var(--ev-spacing-lg);
    }

    .ev-accordion__title {
      @include type.style('subheading/h6');
    }

    &.ev-accordion--expanded {
      .ev-accordion__header {
        padding: var(--ev-spacing-lg) var(--ev-spacing-lg) var(--ev-spacing-xs);
      }

      .ev-accordion__panel {
        padding: var(--ev-spacing-md) var(--ev-spacing-lg) var(--ev-spacing-lg);
      }
    }
  }

  /* Disabled mutes the whole header to one flat tone rather than dimming it. */
  &--disabled {
    --ev-accordion-title: var(--ev-text-disabled);
    --ev-accordion-subtext: var(--ev-text-disabled);
    --ev-accordion-chevron: var(--ev-text-disabled);
  }
}
</style>
