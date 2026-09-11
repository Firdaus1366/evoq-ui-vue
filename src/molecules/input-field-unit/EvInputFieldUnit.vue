<script setup lang="ts">
import { computed, useId } from 'vue'
import EvInput from '../../atoms/input/EvInput.vue'

defineOptions({
  name: 'EvInputFieldUnit',
  inheritAttrs: false,
})

export interface UnitOption {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    unit?: string
    units?: (string | UnitOption)[]
    type?: string
    placeholder?: string
    label?: string
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
    unit: '',
    units: () => ['IDR', 'USD', 'EUR'],
    type: 'text',
    placeholder: undefined,
    label: undefined,
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
  'update:unit': [unit: string]
  clear: []
}>()

const selectId = `ev-input-unit-sel-${useId()}`
const messageId = `ev-input-unit-msg-${useId()}`

const normalizedUnits = computed<UnitOption[]>(() => {
  return props.units.map((u) => (typeof u === 'string' ? { label: u, value: u } : u))
})

const hasMessage = computed(() => Boolean(props.validationText || props.validationTextEnd))

function onUnitChange(event: Event) {
  emit('update:unit', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <div
    class="ev-input-field-unit"
    :class="{
      'ev-input-field-unit--error': error,
      'ev-input-field-unit--disabled': disabled,
    }"
  >
    <div class="ev-input-field-unit__field">
      <!-- Leading Unit Selector -->
      <div class="ev-input-field-unit__unit-wrap">
        <select
          :id="selectId"
          class="ev-input-field-unit__select"
          :value="unit || (normalizedUnits[0] ? normalizedUnits[0].value : '')"
          :disabled="disabled || readonly"
          aria-label="Pilih Satuan"
          @change="onUnitChange"
        >
          <option v-for="opt in normalizedUnits" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <span class="ev-input-field-unit__chevron" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>

      <!--
        node: InputField - an instance of the field atom, notched label and
        all. The message is not handed to it: the board runs one message under
        both boxes, so this component renders it and points the field at it.
      -->
      <EvInput
        v-bind="$attrs"
        :model-value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :label="label"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :error="error"
        :clearable="clearable"
        :aria-describedby="hasMessage ? messageId : undefined"
        @update:model-value="emit('update:modelValue', $event)"
        @clear="emit('clear')"
      />
    </div>

    <p v-if="hasMessage" :id="messageId" class="ev-input-field-unit__message">
      <span>{{ validationText }}</span>
      <span v-if="validationTextEnd" class="ev-input-field-unit__message-end">{{
        validationTextEnd
      }}</span>
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-input-field-unit {
  --ev-input-bg: var(--ev-bg-primary);
  --ev-input-border: var(--ev-border-primary);
  --ev-input-fg: var(--ev-text-primary);
  --ev-input-placeholder: var(--ev-text-tertiary);
  --ev-input-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  /*
   * The board draws `Field` as a bare HORIZONTAL row with gap 4 holding two
   * independent inputs - `InputDropdown` and `InputField` - each with its own
   * 1px border and 6px radius. There is no merged box and no grey unit block.
   */
  &__field {
    box-sizing: border-box;
    display: flex;
    align-items: stretch;
    gap: var(--ev-spacing-xs);
  }

  &__unit-wrap {
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

    &:focus-within {
      border-color: var(--ev-brand-primary);
    }
  }

  &__select {
    appearance: none;
    padding: 0 28px 0 12px;
    height: 100%;
    border: none;
    background: transparent;
    color: var(--ev-text-primary);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;

    &:disabled {
      cursor: not-allowed;
    }
  }

  &__chevron {
    position: absolute;
    right: 8px;
    pointer-events: none;
    display: inline-flex;
    align-items: center;
    color: var(--ev-text-secondary);

    svg {
      width: 14px;
      height: 14px;
    }
  }

  /* The InputField atom takes the rest of the row; its look is its own. */
  &__field > .ev-input {
    flex: 1;
    min-width: 0;
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
  }

  &--disabled {
    --ev-input-bg: var(--ev-bg-subtle);
    cursor: not-allowed;
  }
}
</style>
