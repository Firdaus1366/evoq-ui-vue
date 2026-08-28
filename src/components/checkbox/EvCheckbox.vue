<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'EvCheckbox',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /**
     * Renders the dash instead of the tick. Independent of `modelValue`, the
     * same way the DOM's own `indeterminate` flag is.
     */
    indeterminate?: boolean
    disabled?: boolean
    /** Draws the error border and tints the subtext. */
    error?: boolean
    label?: string
    subtext?: string
    value?: string | number
  }>(),
  {
    modelValue: false,
    indeterminate: false,
    disabled: false,
    error: false,
    label: undefined,
    subtext: undefined,
    value: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  default?: () => unknown
  subtext?: () => unknown
}>()

const stateClass = computed(() => {
  if (props.indeterminate) return 'ev-checkbox--indeterminate'
  return props.modelValue ? 'ev-checkbox--checked' : 'ev-checkbox--unchecked'
})

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).checked)
}
</script>

<template>
  <label
    class="ev-checkbox"
    :class="[stateClass, { 'ev-checkbox--disabled': disabled, 'ev-checkbox--error': error }]"
  >
    <span class="ev-checkbox__box">
      <!--
        `indeterminate` has no HTML attribute - it exists only as a DOM
        property, so it is bound with `.prop` rather than set from an effect.
      -->
      <input
        v-bind="$attrs"
        class="ev-checkbox__input"
        type="checkbox"
        :checked="modelValue"
        :indeterminate.prop="indeterminate"
        :disabled="disabled"
        :value="value"
        :aria-invalid="error || undefined"
        @change="onChange"
      />
      <svg
        v-if="indeterminate"
        class="ev-checkbox__mark"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 8h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <svg
        v-else-if="modelValue"
        class="ev-checkbox__mark"
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M3.5 8.5l3 3 6-6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        />
      </svg>
    </span>

    <span v-if="label || subtext || $slots.default || $slots.subtext" class="ev-checkbox__text">
      <span class="ev-checkbox__label"
        ><slot>{{ label }}</slot></span
      >
      <span v-if="subtext || $slots.subtext" class="ev-checkbox__subtext">
        <slot name="subtext">{{ subtext }}</slot>
      </span>
    </span>
  </label>
</template>

<style lang="scss">
@use '../../styles/a11y';
@use '../../styles/typography' as type;

/*
 * Traced from the `Checkbox` component set in Figma (7 states: Uncheck, Check,
 * Indeterminate, their three disabled counterparts, and Error).
 *
 * The three disabled states share one visual treatment - a muted box with a
 * muted mark - so they collapse into `--disabled` rather than three modifiers.
 */
.ev-checkbox {
  --ev-checkbox-box-bg: var(--ev-bg-primary);
  --ev-checkbox-box-border: var(--ev-border-primary);
  --ev-checkbox-mark: var(--ev-text-inverse);
  --ev-checkbox-label: var(--ev-text-primary);
  --ev-checkbox-subtext: var(--ev-text-secondary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ev-spacing-sm);
  padding: var(--ev-spacing-xs);
  cursor: pointer;

  &__box {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border: var(--ev-stroke-xs) solid var(--ev-checkbox-box-border);
    border-radius: var(--ev-radius-3xs);
    background-color: var(--ev-checkbox-box-bg);
    color: var(--ev-checkbox-mark);
  }

  /*
   * The input covers the whole box, so its own focus ring traces the box -
   * no `:has()` needed to move the ring onto the parent.
   */
  &__input {
    @include a11y.visually-hidden-input;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
      border-radius: var(--ev-radius-3xs);
    }
  }

  &__mark {
    width: 16px;
    height: 16px;
    pointer-events: none;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__label {
    color: var(--ev-checkbox-label);

    @include type.style('body/regular');
  }

  &__subtext {
    color: var(--ev-checkbox-subtext);

    @include type.style('body/regular');
  }

  /* Checked and indeterminate share one filled box. */
  &--checked,
  &--indeterminate {
    --ev-checkbox-box-bg: var(--ev-brand-primary);
    --ev-checkbox-box-border: var(--ev-brand-primary);
  }

  /*
   * Error only restyles the box and the subtext - the label keeps its normal
   * colour, so the row does not read as entirely invalid.
   */
  &--error {
    --ev-checkbox-box-bg: var(--ev-bg-primary);
    --ev-checkbox-box-border: var(--ev-ext-error);
    --ev-checkbox-subtext: var(--ev-ext-error-bold);
  }

  &--disabled {
    --ev-checkbox-box-bg: var(--ev-bg-secondary);
    --ev-checkbox-box-border: var(--ev-border-primary);
    --ev-checkbox-mark: var(--ev-text-disabled);
    --ev-checkbox-label: var(--ev-text-disabled);
    --ev-checkbox-subtext: var(--ev-text-disabled);

    cursor: not-allowed;
  }
}
</style>
