<script setup lang="ts">
import { computed, provide } from 'vue'
import type { ToggleSize, ToggleVariant } from '../../types'
import { TOGGLE_GROUP_KEY } from '../../atoms/toggle/context'

defineOptions({
  name: 'EvToggleGroup',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Sets the gap and cascades default size to child `EvToggle`s. */
    size?: ToggleSize
    /** Cascades default variant to child `EvToggle`s. */
    variant?: ToggleVariant
    /** Accessible name for the group. */
    label?: string
  }>(),
  {
    size: 'default',
    variant: undefined,
    label: undefined,
  },
)

provide(TOGGLE_GROUP_KEY, {
  size: computed(() => props.size),
  variant: computed(() => props.variant),
})

defineSlots<{
  default?: () => unknown
}>()
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-toggle-group"
    :class="`ev-toggle-group--size-${size}`"
    role="group"
    :aria-label="label"
  >
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `ToggleGroup` component set in Figma. The group spaces its
 * children and cascades its size and variant to them.
 */
.ev-toggle-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  &--size-default {
    gap: var(--ev-spacing-sm);
  }

  &--size-small {
    gap: var(--ev-spacing-xs);
  }
}
</style>
