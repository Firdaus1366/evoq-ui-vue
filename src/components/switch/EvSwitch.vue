<script setup lang="ts">
import { computed } from 'vue'
import type { SwitchSize } from '../../types'

defineOptions({
  name: 'EvSwitch',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    size?: SwitchSize
    disabled?: boolean
    /** Paints the track in the error colour, on or off. */
    error?: boolean
    /** Label rendered inside the track, beside the thumb. */
    text?: string
    /** Visible label beside the switch. */
    label?: string
    /** Subtext rendered under the visible label. */
    subtext?: string
    /** Position of the visible label/subtext relative to the switch. */
    labelPlacement?: 'left' | 'right'
    /** Accessible name when no visible label is provided. */
    ariaLabel?: string
  }>(),
  {
    modelValue: false,
    size: 'default',
    disabled: false,
    error: false,
    text: undefined,
    label: undefined,
    subtext: undefined,
    labelPlacement: 'right',
    ariaLabel: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const slots = defineSlots<{
  default?: () => unknown
  subtext?: () => unknown
}>()

const hasText = computed(() => props.text !== undefined && props.text !== '')
const hasField = computed(() =>
  Boolean(props.label || props.subtext || slots.default || slots.subtext),
)

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label
    v-if="hasField"
    class="ev-switch-wrapper"
    :class="[
      `ev-switch-wrapper--label-${labelPlacement}`,
      `ev-switch-wrapper--${size}`,
      {
        'ev-switch-wrapper--disabled': disabled,
        'ev-switch-wrapper--error': error,
      },
    ]"
    @click.prevent="toggle"
  >
    <button
      v-bind="$attrs"
      type="button"
      role="switch"
      class="ev-switch"
      :class="[
        `ev-switch--${size}`,
        modelValue ? 'ev-switch--on' : 'ev-switch--off',
        {
          'ev-switch--disabled': disabled,
          'ev-switch--error': error,
          'ev-switch--with-text': hasText,
        },
      ]"
      :aria-checked="modelValue"
      :aria-label="ariaLabel || label"
      :disabled="disabled"
    >
      <span class="ev-switch__track">
        <span class="ev-switch__thumb" />
        <span v-if="hasText" class="ev-switch__text">{{ text }}</span>
      </span>
    </button>

    <span class="ev-switch-wrapper__text">
      <span v-if="label || $slots.default" class="ev-switch-wrapper__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="subtext || $slots.subtext" class="ev-switch-wrapper__subtext">
        <slot name="subtext">{{ subtext }}</slot>
      </span>
    </span>
  </label>

  <button
    v-else
    v-bind="$attrs"
    type="button"
    role="switch"
    class="ev-switch"
    :class="[
      `ev-switch--${size}`,
      modelValue ? 'ev-switch--on' : 'ev-switch--off',
      {
        'ev-switch--disabled': disabled,
        'ev-switch--error': error,
        'ev-switch--with-text': hasText,
      },
    ]"
    :aria-checked="modelValue"
    :aria-label="ariaLabel || label"
    :disabled="disabled"
    @click="toggle"
  >
    <span class="ev-switch__track">
      <span class="ev-switch__thumb" />
      <span v-if="hasText" class="ev-switch__text">{{ text }}</span>
    </span>
  </button>
</template>

<style lang="scss">
@use '../../styles/typography' as type;
/*
 * Traced from the `.Switch` component set in Figma (24 variants: Size x State
 * x Has Text Inside).
 *
 * The thumb is not translated - it is a flex item, and the track reverses its
 * direction when on. That reproduces Figma exactly (where the On variants list
 * the label before the thumb) and keeps the label on the correct side without
 * a second set of measurements.
 */
.ev-switch {
  --ev-switch-track: var(--ev-bg-tertiary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  padding: var(--ev-spacing-2xs) 0;
  border: 0;
  background: none;
  cursor: pointer;

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
    border-radius: var(--ev-radius-rd);
  }

  &__track {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-xs);
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-switch-track);
    transition: background-color var(--ev-duration-fast) var(--ev-easing-standard);
  }

  &__thumb {
    flex-shrink: 0;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-bg-primary);
  }

  &__text {
    color: var(--ev-text-inverse);
    font-family: var(--ev-font-family-base);
    font-weight: var(--ev-font-weight-medium);
    white-space: nowrap;
  }

  /* Sizes - the track is 4px shorter than the control's own box. */
  &--default {
    .ev-switch__track {
      width: 40px;
      height: 20px;
      padding: var(--ev-spacing-xs);
    }

    .ev-switch__thumb {
      width: 12px;
      height: 12px;
    }

    .ev-switch__text {
      font-size: var(--ev-font-size-2xs);
      line-height: var(--ev-line-height-xs);
    }
  }

  &--small {
    .ev-switch__track {
      width: 24px;
      height: 12px;
      padding: var(--ev-spacing-2xs);
    }

    .ev-switch__thumb {
      width: 8px;
      height: 8px;
    }

    .ev-switch__text {
      font-size: var(--ev-font-size-3xs);
      line-height: var(--ev-line-height-2xs);
    }
  }

  /* A labelled track is wider, and its padding is asymmetric around the thumb. */
  &--with-text {
    &.ev-switch--default .ev-switch__track {
      width: 54px;
      padding: var(--ev-spacing-2xs) var(--ev-spacing-sm) var(--ev-spacing-2xs) var(--ev-spacing-xs);
    }

    &.ev-switch--small .ev-switch__track {
      width: 39px;
      padding: 0 var(--ev-spacing-xs) 0 var(--ev-spacing-2xs);
    }

    /* On flips the row, so the padding flips with it. */
    &.ev-switch--on .ev-switch__track {
      flex-direction: row-reverse;
    }

    &.ev-switch--on.ev-switch--default .ev-switch__track {
      padding: var(--ev-spacing-2xs) var(--ev-spacing-xs) var(--ev-spacing-2xs) var(--ev-spacing-sm);
    }

    &.ev-switch--on.ev-switch--small .ev-switch__track {
      padding: 0 var(--ev-spacing-2xs) 0 var(--ev-spacing-xs);
    }
  }

  /* Without a label the thumb slides by justifying the row. */
  &:not(.ev-switch--with-text).ev-switch--on .ev-switch__track {
    justify-content: flex-end;
  }

  &--on {
    --ev-switch-track: var(--ev-brand-primary);
  }

  /* Error outranks on/off: the track is red in both. */
  &--error {
    --ev-switch-track: var(--ev-ext-error);
  }

  /* Disabled outranks everything, including error. */
  &--disabled {
    --ev-switch-track: var(--ev-bg-subtlest);

    cursor: not-allowed;
  }
}

.ev-switch-wrapper {
  --ev-switch-label: var(--ev-text-primary);
  --ev-switch-subtext: var(--ev-text-secondary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: flex-start;
  gap: var(--ev-spacing-sm);
  cursor: pointer;

  /* The board pads the Text block 4,0,4,0 at Default and 0 at Small. */
  &--default {
    padding: var(--ev-spacing-xs) 0;
  }

  &--small {
    padding: 0;
  }

  &--label-left {
    flex-direction: row-reverse;
    justify-content: flex-end;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__label {
    color: var(--ev-switch-label);

    @include type.style('body/regular');
  }

  &__subtext {
    color: var(--ev-switch-subtext);

    @include type.style('body/regular');
  }

  &--error {
    --ev-switch-subtext: var(--ev-ext-error-bold);
  }

  /*
   * The board does NOT dim the text in the Disable states - Label stays
   * #071437 and Subtext #78829d. Only the track changes.
   */
  &--disabled {
    cursor: not-allowed;
  }
}
</style>
