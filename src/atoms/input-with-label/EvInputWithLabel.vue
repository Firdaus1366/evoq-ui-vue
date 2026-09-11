<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({
  name: 'EvInputWithLabel',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    label?: string
    /** Text for left inline label prefix */
    prefixLabel?: string
    /** Text for right inline label suffix */
    suffixLabel?: string
    /** Position placement for inline labels */
    placement?: 'left' | 'right' | 'both'
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    error?: boolean
    validationText?: string
    validationTextEnd?: string
    clearable?: boolean
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: undefined,
    label: undefined,
    prefixLabel: undefined,
    suffixLabel: undefined,
    placement: 'left',
    required: false,
    disabled: false,
    readonly: false,
    error: false,
    validationText: undefined,
    validationTextEnd: undefined,
    clearable: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
}>()

const slots = defineSlots<{
  iconLeft?: () => unknown
  iconRight?: () => unknown
  prefix?: () => unknown
  suffix?: () => unknown
}>()

const inputId = `ev-input-label-${useId()}`
const messageId = `ev-input-label-msg-${useId()}`

const showLeft = computed(
  () => (props.placement === 'left' || props.placement === 'both') && (props.prefixLabel || true),
)
const showRight = computed(
  () => (props.placement === 'right' || props.placement === 'both') && (props.suffixLabel || true),
)

/*
 * The board pads Content on whichever side has no addon, so the addon can sit
 * flush against the border: L Label 0,8,0,0 - R Label 0,0,0,8 - L R Label 0.
 */
const hasLeftAddon = computed(() => Boolean(showLeft.value && (props.prefixLabel || slots.prefix)))
const hasRightAddon = computed(() =>
  Boolean(showRight.value && (props.suffixLabel || slots.suffix)),
)

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
    class="ev-input-with-label"
    :class="{
      'ev-input-with-label--error': error,
      'ev-input-with-label--disabled': disabled,
    }"
  >
    <div
      class="ev-input-with-label__field"
      :class="{
        'ev-input-with-label__field--pad-left': !hasLeftAddon,
        'ev-input-with-label__field--pad-right': !hasRightAddon,
      }"
    >
      <!-- Left inline addon -->
      <div
        v-if="showLeft && (prefixLabel || $slots.prefix)"
        class="ev-input-with-label__addon ev-input-with-label__addon--left"
      >
        <slot name="prefix">{{ prefixLabel }}</slot>
      </div>

      <div class="ev-input-with-label__input-wrap">
        <span v-if="$slots.iconLeft" class="ev-input-with-label__icon"
          ><slot name="iconLeft"
        /></span>

        <input
          :id="inputId"
          v-bind="$attrs"
          class="ev-input-with-label__control"
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
          class="ev-input-with-label__clear"
          aria-label="Bersihkan"
          @click="clear"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
            <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </button>

        <span v-if="error" class="ev-input-with-label__icon ev-input-with-label__icon--error">
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
        <span v-else-if="$slots.iconRight" class="ev-input-with-label__icon"
          ><slot name="iconRight"
        /></span>
      </div>

      <!-- Right inline addon -->
      <div
        v-if="showRight && (suffixLabel || $slots.suffix)"
        class="ev-input-with-label__addon ev-input-with-label__addon--right"
      >
        <slot name="suffix">{{ suffixLabel }}</slot>
      </div>
    </div>

    <p v-if="hasMessage" :id="messageId" class="ev-input-with-label__message">
      <span>{{ validationText }}</span>
      <span v-if="validationTextEnd" class="ev-input-with-label__message-end">{{
        validationTextEnd
      }}</span>
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-input-with-label {
  --ev-input-bg: var(--ev-bg-primary);
  --ev-input-addon-bg: var(--ev-bg-subtle);
  --ev-input-border: var(--ev-border-primary);
  --ev-input-fg: var(--ev-text-primary);
  --ev-input-placeholder: var(--ev-text-tertiary);
  --ev-input-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  &__field {
    box-sizing: border-box;
    display: flex;
    align-items: stretch;
    gap: var(--ev-spacing-xs);
    min-height: 44px;
    border: var(--ev-stroke-xs) solid var(--ev-input-border);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-input-bg);
    transition: border-color var(--ev-duration-fast) var(--ev-easing-standard);

    &:focus-within {
      border-color: var(--ev-brand-primary);
    }

    &--pad-left {
      padding-left: var(--ev-spacing-sm);
    }

    &--pad-right {
      padding-right: var(--ev-spacing-sm);
    }
  }

  &__addon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ev-spacing-xs);
    min-width: 48px;
    padding: var(--ev-spacing-sm);
    background-color: var(--ev-input-addon-bg);
    color: var(--ev-text-primary);
    user-select: none;

    @include type.style('body/small');

    &--left {
      border-top-left-radius: inherit;
      border-bottom-left-radius: inherit;
    }

    &--right {
      border-top-right-radius: inherit;
      border-bottom-right-radius: inherit;
    }
  }

  &__input-wrap {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    min-width: 0;
    padding: 0;
  }

  &__control {
    flex: 1;
    min-width: 0;
    height: 100%;
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

  &--error {
    --ev-input-border: var(--ev-ext-error);
    --ev-input-fg: var(--ev-ext-error-bold);
    --ev-input-message: var(--ev-ext-error);

    .ev-input-with-label__field:focus-within {
      border-color: var(--ev-ext-error);
    }
  }

  &--disabled {
    --ev-input-bg: var(--ev-bg-subtle);
    --ev-input-addon-bg: var(--ev-bg-subtler);
    cursor: not-allowed;
  }
}
</style>
