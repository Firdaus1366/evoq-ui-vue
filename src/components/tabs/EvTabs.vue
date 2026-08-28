<script setup lang="ts">
import { computed, provide, ref, toRef, useId } from 'vue'
import { TABS_KEY } from './context'
import type { TabsVariant } from '../../types'

defineOptions({
  name: 'EvTabs',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    variant?: TabsVariant
    /** Accessible name for the tab list. */
    label?: string
  }>(),
  {
    modelValue: null,
    variant: 'segmented',
    label: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

defineSlots<{
  default?: () => unknown
}>()

const baseId = `ev-tabs-${useId()}`

/**
 * Tabs register themselves in render order. The list is what arrow keys walk,
 * so it has to reflect the DOM, not the order props happened to arrive in.
 */
const registered = ref<Array<string | number>>([])

provide(TABS_KEY, {
  variant: toRef(props, 'variant'),
  selected: toRef(props, 'modelValue'),
  select: (value) => emit('update:modelValue', value),
  register: (value) => {
    if (!registered.value.includes(value)) registered.value.push(value)
  },
  unregister: (value) => {
    registered.value = registered.value.filter((v) => v !== value)
  },
  values: computed(() => registered.value),
  baseId,
})
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-tabs"
    :class="`ev-tabs--${variant}`"
    role="tablist"
    :aria-label="label"
  >
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Tabs` component set in Figma (Segmented and Line).
 *
 * The two variants are structurally different, not just skinned: Segmented is
 * a bordered pill holding its tabs, Line is a bare row whose active tab carries
 * a 2px underline.
 */
.ev-tabs {
  box-sizing: border-box;
  display: flex;
  align-items: center;

  &--segmented {
    gap: var(--ev-spacing-xs);
    padding: var(--ev-spacing-xs);
    border: var(--ev-stroke-xs) solid var(--ev-border-tertiary);
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-bg-secondary);
  }

  &--line {
    gap: var(--ev-spacing-md);
  }
}
</style>
