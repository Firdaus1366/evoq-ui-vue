<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import EvDropdownItem from '../../atoms/dropdown-item/EvDropdownItem.vue'
import EvInput from '../../atoms/input/EvInput.vue'
import EvInputDropdown from '../../atoms/input-dropdown/EvInputDropdown.vue'

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
    /** Title of the value field (`InputField`). */
    label?: string
    /** Title of the unit dropdown (`InputDropdown`). */
    unitLabel?: string
    /** Shown in the dropdown while no unit is chosen - the board's `Select`. */
    unitPlaceholder?: string
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
    unitLabel: undefined,
    unitPlaceholder: 'Select',
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

const messageId = `ev-input-unit-msg-${useId()}`

const normalizedUnits = computed<UnitOption[]>(() => {
  return props.units.map((u) => (typeof u === 'string' ? { label: u, value: u } : u))
})

const hasMessage = computed(() => Boolean(props.validationText || props.validationTextEnd))

const unitOpen = ref(false)
const selected = computed(() => props.unit)
const selectedLabel = computed(
  () => normalizedUnits.value.find((u) => u.value === selected.value)?.label ?? selected.value,
)

function chooseUnit(value: string) {
  emit('update:unit', value)
  unitOpen.value = false
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
      <!--
        node: InputDropdown - an instance of the dropdown atom (Size=Default),
        hugging its content while the InputField beside it fills the row.
      -->
      <EvInputDropdown
        v-model:open="unitOpen"
        class="ev-input-field-unit__unit"
        :model-value="selectedLabel"
        :label="unitLabel"
        :placeholder="unitPlaceholder"
        :disabled="disabled || readonly"
        :error="error"
        @update:model-value="emit('update:unit', '')"
      >
        <ul class="ev-input-field-unit__options" role="listbox" aria-label="Pilih Satuan">
          <EvDropdownItem
            v-for="opt in normalizedUnits"
            :key="opt.value"
            :label="opt.label"
            :active="opt.value === selected"
            @select="chooseUnit(opt.value)"
          />
        </ul>
      </EvInputDropdown>

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
    align-items: flex-start;
    gap: var(--ev-spacing-xs);
  }

  /* The dropdown hugs its content (board 95px); the field takes the rest. */
  &__field > .ev-input-dropdown {
    flex: none;
  }

  &__options {
    margin: 0;
    padding: 0;
    list-style: none;
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
