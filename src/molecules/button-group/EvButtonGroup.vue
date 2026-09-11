<script setup lang="ts">
import { provide, toRef } from 'vue'
import { BUTTON_GROUP_KEY } from './context'
import type { ButtonGroupSize, ButtonGroupVariant } from '../../types'

defineOptions({
  name: 'EvButtonGroup',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Applied to every item unless one overrides it. */
    variant?: ButtonGroupVariant
    size?: ButtonGroupSize
    /** Accessible name for the control. */
    label?: string
  }>(),
  {
    variant: 'default-light',
    size: 'large',
    label: undefined,
  },
)

defineSlots<{
  /** The items - one `EvButtonGroupItem` each. */
  default?: () => unknown
}>()

provide(BUTTON_GROUP_KEY, {
  variant: toRef(props, 'variant'),
  size: toRef(props, 'size'),
})
</script>

<template>
  <div v-bind="$attrs" class="ev-button-group" role="group" :aria-label="label">
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `ButtonGroup` component set in Figma.
 *
 * The board's `Number of Button` property (2-9, plus 9+) is a canvas sizing
 * device, not an API - the items are whatever is slotted in. Its usage doc
 * caps a group at nine and sends longer ranges to Pagination.
 */
.ev-button-group {
  display: inline-flex;
  align-items: stretch;
}
</style>
