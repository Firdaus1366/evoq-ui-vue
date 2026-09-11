<script setup lang="ts">
import { computed, inject } from 'vue'
import { RADIO_GROUP_KEY } from './context'

defineOptions({
  name: 'EvRadio',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Value this radio contributes when selected. */
    value: string | number
    /** Only used when the radio is not inside an `EvRadioGroup`. */
    modelValue?: string | number | null
    name?: string
    disabled?: boolean
    error?: boolean
    label?: string
    subtext?: string
  }>(),
  {
    modelValue: undefined,
    name: undefined,
    disabled: false,
    error: false,
    label: undefined,
    subtext: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

defineSlots<{
  default?: () => unknown
  subtext?: () => unknown
}>()

const group = inject(RADIO_GROUP_KEY, null)

const checked = computed(() =>
  group ? group.selected.value === props.value : props.modelValue === props.value,
)
// A group-level flag turns on every radio beneath it; a radio can also opt in
// on its own.
const isDisabled = computed(() => props.disabled || (group?.disabled.value ?? false))
const isError = computed(() => props.error || (group?.error.value ?? false))
const name = computed(() => props.name ?? group?.name.value)

function onChange() {
  if (isDisabled.value) return
  if (group) group.select(props.value)
  else emit('update:modelValue', props.value)
}
</script>

<template>
  <label
    class="ev-radio"
    :class="{
      'ev-radio--checked': checked,
      'ev-radio--disabled': isDisabled,
      'ev-radio--error': isError,
    }"
  >
    <span class="ev-radio__dot">
      <input
        v-bind="$attrs"
        class="ev-radio__input"
        type="radio"
        :name="name"
        :value="value"
        :checked="checked"
        :disabled="isDisabled"
        :aria-invalid="isError || undefined"
        @change="onChange"
      />
      <span v-if="checked" class="ev-radio__indicator" aria-hidden="true" />
    </span>

    <span v-if="label || subtext || $slots.default || $slots.subtext" class="ev-radio__text">
      <span class="ev-radio__label"
        ><slot>{{ label }}</slot></span
      >
      <span v-if="subtext || $slots.subtext" class="ev-radio__subtext">
        <slot name="subtext">{{ subtext }}</slot>
      </span>
    </span>
  </label>
</template>

<style lang="scss">
@use '../../styles/a11y';
@use '../../styles/typography' as type;

/*
 * Traced from the `RadioButton` component set in Figma (5 states: Default,
 * Active, Disable, Disable Active, Error).
 *
 * Note that the resting border is `border/secondary`, a step lighter than the
 * checkbox's - the two controls are deliberately not identical.
 */
.ev-radio {
  --ev-radio-bg: var(--ev-bg-primary);
  --ev-radio-border: var(--ev-border-secondary);
  --ev-radio-dot: var(--ev-bg-primary);
  --ev-radio-label: var(--ev-text-primary);
  --ev-radio-subtext: var(--ev-text-secondary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ev-spacing-sm);
  padding: var(--ev-spacing-xs);
  cursor: pointer;

  &__dot {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border: var(--ev-stroke-xs) solid var(--ev-radio-border);
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-radio-bg);
  }

  &__input {
    @include a11y.visually-hidden-input;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
      border-radius: var(--ev-radius-rd);
    }
  }

  &__indicator {
    width: 8px;
    height: 8px;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-radio-dot);
    pointer-events: none;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__label {
    color: var(--ev-radio-label);

    @include type.style('body/regular');
  }

  &__subtext {
    color: var(--ev-radio-subtext);

    @include type.style('body/regular');
  }

  &--checked {
    --ev-radio-bg: var(--ev-brand-primary);
    --ev-radio-border: var(--ev-brand-primary);
  }

  &--error {
    --ev-radio-bg: var(--ev-bg-primary);
    --ev-radio-border: var(--ev-ext-error);
    --ev-radio-subtext: var(--ev-ext-error-bold);
  }

  /*
   * Unselected disabled fills the dot and mutes the labels. Selected disabled
   * keeps the brand fill and dims the whole row instead - hence the opacity
   * living on the checked-and-disabled pairing rather than on `--disabled`.
   */
  &--disabled {
    --ev-radio-bg: var(--ev-bg-subtle);
    --ev-radio-border: var(--ev-border-primary);
    --ev-radio-label: var(--ev-text-disabled);
    --ev-radio-subtext: var(--ev-text-disabled);

    cursor: not-allowed;

    &.ev-radio--checked {
      --ev-radio-bg: var(--ev-brand-primary);
      --ev-radio-border: transparent;

      opacity: 0.5;
    }
  }
}
</style>
