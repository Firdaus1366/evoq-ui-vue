<script setup lang="ts">
import { computed, provide, toRef, useId } from 'vue'
import { RADIO_GROUP_KEY } from './context'

defineOptions({
  name: 'EvRadioGroup',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    /** Shared `name` for the underlying inputs. Generated when omitted. */
    name?: string
    /** Disables every radio in the group. */
    disabled?: boolean
    /** Puts every radio in the group into the error state. */
    error?: boolean
    /** Accessible name for the group. */
    label?: string
  }>(),
  {
    modelValue: null,
    name: undefined,
    disabled: false,
    error: false,
    label: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

defineSlots<{
  default?: () => unknown
}>()

// Radios in one group must share a `name`; `useId` gives a stable one that
// survives SSR hydration, which a random string would not.
const fallbackName = `ev-radio-${useId()}`

provide(RADIO_GROUP_KEY, {
  name: computed(() => props.name ?? fallbackName),
  selected: toRef(props, 'modelValue'),
  disabled: toRef(props, 'disabled'),
  error: toRef(props, 'error'),
  select: (value: string | number) => emit('update:modelValue', value),
})
</script>

<template>
  <div v-bind="$attrs" class="ev-radio-group" role="radiogroup" :aria-label="label">
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * The Figma page draws `RadioButton` on its own; the group is the container
 * pattern the usage doc shows around it.
 */
.ev-radio-group {
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);
}
</style>
