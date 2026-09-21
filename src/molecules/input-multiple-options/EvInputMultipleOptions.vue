<script setup lang="ts">
import { useId } from 'vue'
import EvCheckbox from '../../atoms/checkbox/EvCheckbox.vue'
import type { InputOption } from '../../types'

/*
 * Compiled from the Figma `InputMultipleOptions` set (859:2091), State only.
 *
 *   State=<x>            VERTICAL gap 4  w FILL
 *   +-- .Input           Title 12
 *   +-- Frame            HORIZONTAL wrap  gap 8  row-gap 8
 *   |   +-- Checkbox x N instances of Checkbox (Check / Uncheck / Error / Disable)
 *   +-- .ValidationText  [Has Validation Text]
 *
 * The board draws no border or surface: the list sits directly on the page.
 */

defineOptions({
  name: 'EvInputMultipleOptions',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Values of the ticked rows. */
    modelValue?: (string | number)[]
    options?: InputOption[]
    /** `.Input` Title. */
    label?: string
    disabled?: boolean
    error?: boolean
    validationText?: string
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    label: undefined,
    disabled: false,
    error: false,
    validationText: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
}>()

const uid = useId()
const titleId = `ev-input-multiple-options-title-${uid}`
const messageId = `ev-input-multiple-options-msg-${uid}`

function toggle(value: string | number, on: boolean) {
  const rest = props.modelValue.filter((v) => v !== value)
  emit('update:modelValue', on ? [...rest, value] : rest)
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-input-multiple-options"
    :class="{
      'ev-input-multiple-options--error': error,
      'ev-input-multiple-options--disabled': disabled,
    }"
    role="group"
    :aria-labelledby="label ? titleId : undefined"
    :aria-describedby="validationText ? messageId : undefined"
  >
    <span v-if="label" :id="titleId" class="ev-input-multiple-options__title">{{ label }}</span>

    <div class="ev-input-multiple-options__list">
      <EvCheckbox
        v-for="option in options"
        :key="option.value"
        :model-value="modelValue.includes(option.value)"
        :value="option.value"
        :label="option.label"
        :disabled="disabled || option.disabled"
        :error="error"
        @update:model-value="toggle(option.value, $event)"
      />
    </div>

    <p v-if="validationText" :id="messageId" class="ev-input-multiple-options__message">
      {{ validationText }}
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-input-multiple-options {
  --ev-imo-title: var(--ev-text-secondary);
  --ev-imo-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  &__title {
    color: var(--ev-imo-title);

    @include type.style('body/small');
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ev-spacing-sm);
  }

  &__message {
    margin: 0;
    color: var(--ev-imo-message);

    @include type.style('body/small');
  }

  &--error {
    --ev-imo-title: var(--ev-ext-error-bold);
    --ev-imo-message: var(--ev-ext-error);
  }

  &--disabled {
    --ev-imo-title: var(--ev-text-primary);
  }
}
</style>
