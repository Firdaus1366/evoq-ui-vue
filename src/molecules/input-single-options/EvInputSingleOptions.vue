<script setup lang="ts">
import { computed, provide, toRef, useId } from 'vue'
import EvRadio from '../../atoms/radio/EvRadio.vue'
import { RADIO_GROUP_KEY } from '../../atoms/radio/context'
import type { InputOption } from '../../types'

/*
 * Compiled from the Figma `InputSingleOptions` set (702:3422), State only.
 *
 *   State=<x>            VERTICAL gap 4  w FILL
 *   +-- .Input           Title 12
 *   +-- Frame            HORIZONTAL wrap  gap 8  row-gap 8
 *   |   +-- RadioButton x N instances of RadioButton (Default / Active / Error)
 *   +-- .ValidationText  [Has Validation Text]
 *
 * The board draws no border or surface: the list sits directly on the page.
 */

defineOptions({
  name: 'EvInputSingleOptions',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Value of the selected row. */
    modelValue?: string | number | null
    options?: InputOption[]
    /** `.Input` Title. */
    label?: string
    disabled?: boolean
    error?: boolean
    validationText?: string
  }>(),
  {
    modelValue: null,
    options: () => [],
    label: undefined,
    disabled: false,
    error: false,
    validationText: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const uid = useId()
const messageId = `ev-input-single-options-msg-${uid}`

/*
 * The rows are RadioButton instances that share one selection, so this hands
 * them the same context EvRadioGroup does (a molecule may not import it).
 */
provide(RADIO_GROUP_KEY, {
  name: computed(() => `ev-input-single-options-${uid}`),
  selected: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  error: toRef(props, 'error'),
  select: (value: string | number) => emit('update:modelValue', value),
})
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-input-single-options"
    :class="{
      'ev-input-single-options--error': error,
      'ev-input-single-options--disabled': disabled,
    }"
    :aria-describedby="validationText ? messageId : undefined"
  >
    <span v-if="label" aria-hidden="true" class="ev-input-single-options__title">{{ label }}</span>

    <div class="ev-input-single-options__list" role="radiogroup" :aria-label="label">
      <EvRadio
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        :label="option.label"
        :disabled="option.disabled"
      />
    </div>

    <p v-if="validationText" :id="messageId" class="ev-input-single-options__message">
      {{ validationText }}
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-input-single-options {
  --ev-iso-title: var(--ev-text-secondary);
  --ev-iso-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  &__title {
    color: var(--ev-iso-title);

    @include type.style('body/small');
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ev-spacing-sm);
  }

  &__message {
    margin: 0;
    color: var(--ev-iso-message);

    @include type.style('body/small');
  }

  &--error {
    --ev-iso-title: var(--ev-ext-error-bold);
    --ev-iso-message: var(--ev-ext-error);
  }

  &--disabled {
    --ev-iso-title: var(--ev-text-primary);
  }
}
</style>
