<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({
  name: 'EvInput',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    /** Any native input type - `text`, `search`, `email`, `number`, ... */
    type?: string
    placeholder?: string
    /** Container size: default (44px) or small (32px) per Figma spec */
    size?: 'default' | 'small'
    /** Floating label, drawn notched into the field's top border. */
    label?: string
    /** Marks the field required and appends the board's red asterisk. */
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    /** Switches the field to the error style. Always pair it with a message. */
    error?: boolean
    /** Helper text below the field. Turns red in the error state. */
    validationText?: string
    /** Trailing helper text, right-aligned - a counter or a hint. */
    validationTextEnd?: string
    /** Shows the clear button once there is something to clear. */
    clearable?: boolean
    clearLabel?: string
  }>(),
  {
    modelValue: '',
    type: 'text',
    size: 'default',
    placeholder: undefined,
    label: undefined,
    required: false,
    disabled: false,
    readonly: false,
    error: false,
    validationText: undefined,
    validationTextEnd: undefined,
    clearable: false,
    clearLabel: 'Bersihkan',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
}>()

defineSlots<{
  /** Figma's `Has L Icon`. */
  iconLeft?: () => unknown
  /** Figma's `Has R Icon`. Replaced by the error glyph in the error state. */
  iconRight?: () => unknown
}>()

const inputId = `ev-input-${useId()}`
const messageId = `ev-input-message-${useId()}`

const hasValue = computed(() => props.modelValue !== '' && props.modelValue != null)
const showClear = computed(
  () => props.clearable && hasValue.value && !props.disabled && !props.readonly,
)
const hasMessage = computed(() => Boolean(props.validationText || props.validationTextEnd))

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div
    class="ev-input"
    :class="{
      'ev-input--error': error,
      'ev-input--disabled': disabled,
      'ev-input--small': size === 'small',
    }"
  >
    <div class="ev-input__field">
      <span v-if="$slots.iconLeft" class="ev-input__icon"><slot name="iconLeft" /></span>

      <input
        :id="inputId"
        v-bind="$attrs"
        class="ev-input__control"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :aria-invalid="error || undefined"
        :aria-describedby="hasMessage ? messageId : undefined"
        @input="onInput"
      />

      <button
        v-if="showClear"
        type="button"
        class="ev-input__clear"
        :aria-label="clearLabel"
        @click="clear"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>

      <!-- The board swaps the trailing icon for an error glyph when invalid. -->
      <span v-if="error" class="ev-input__icon ev-input__icon--error">
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path
            d="M10 6v5M10 13.5v.5"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </span>
      <span v-else-if="$slots.iconRight" class="ev-input__icon"><slot name="iconRight" /></span>

      <!--
        The floating label is notched into the border: a strip of the field's
        own surface sits behind it so the border appears to break for it.
      -->
      <label v-if="label" class="ev-input__label" :for="inputId">
        {{ label }}<span v-if="required" class="ev-input__required" aria-hidden="true">*</span>
      </label>
    </div>

    <p v-if="hasMessage" :id="messageId" class="ev-input__message">
      <span>{{ validationText }}</span>
      <span v-if="validationTextEnd" class="ev-input__message-end">{{ validationTextEnd }}</span>
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `InputField` component set in Figma (State x icons x
 * validation).
 *
 * Height: 44px (default) or 32px (small).
 */
.ev-input {
  --ev-input-bg: var(--ev-bg-primary);
  --ev-input-border: var(--ev-border-primary);
  --ev-input-fg: var(--ev-text-primary);
  --ev-input-placeholder: var(--ev-text-tertiary);
  --ev-input-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  &__field {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    min-height: 44px;
    padding: var(--ev-spacing-md);
    border: var(--ev-stroke-xs) solid var(--ev-input-border);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-input-bg);
    transition: border-color var(--ev-duration-fast) var(--ev-easing-standard);
  }

  &--small &__field {
    min-height: 32px;
    padding: 6px 12px;
  }

  /* Focus lights the border rather than drawing a ring outside it. */
  &__field:focus-within {
    border-color: var(--ev-brand-primary);
  }

  &__control {
    flex: 1;
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-input-fg);

    @include type.style('body/regular');

    &::placeholder {
      color: var(--ev-input-placeholder);
    }

    &:focus {
      outline: none;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--ev-icon-primary);

    svg {
      width: 20px;
      height: 20px;
    }

    &--error {
      color: var(--ev-ext-error);
    }
  }

  &__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-primary);
    cursor: pointer;

    svg {
      width: 20px;
      height: 20px;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: 1px;
      border-radius: var(--ev-radius-rd);
    }
  }

  &__label {
    position: absolute;
    top: 0;
    left: var(--ev-spacing-md);
    padding: 0 3px;
    transform: translateY(-50%);
    background-color: var(--ev-input-bg);
    color: var(--ev-text-secondary);

    @include type.style('body/small');
  }

  &__required {
    margin-left: 2px;
    color: var(--ev-ext-error);
  }

  &__message {
    display: flex;
    justify-content: space-between;
    gap: var(--ev-spacing-xs);
    margin: 0;
    color: var(--ev-input-message);

    @include type.style('body/small');
  }

  &__message-end {
    flex-shrink: 0;
  }

  /* Error outranks focus: the border stays red while the field is focused. */
  &--error {
    --ev-input-border: var(--ev-ext-error);
    --ev-input-fg: var(--ev-ext-error-bold);
    --ev-input-placeholder: var(--ev-ext-error-bold);
    --ev-input-message: var(--ev-ext-error);

    .ev-input__field:focus-within {
      border-color: var(--ev-ext-error);
    }
  }

  /* Disabled keeps the resting border and greys the surface instead. */
  &--disabled {
    --ev-input-bg: var(--ev-bg-subtle);
    --ev-input-border: var(--ev-border-primary);

    cursor: not-allowed;
  }
}
</style>
