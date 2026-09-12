<script setup lang="ts">
import EvCommandItem from '../../atoms/command-item/EvCommandItem.vue'

defineOptions({
  name: 'EvCommandGroup',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** The "Section Title" row the board draws at the top of each Section. */
    heading?: string
  }>(),
  {
    heading: undefined,
  },
)

defineSlots<{
  /** The rows - `EvCommandItem` instances. */
  default?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-command__group" role="group">
    <ul class="ev-command__list">
      <EvCommandItem v-if="heading" heading :label="heading" />
      <slot />
    </ul>
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `Section` frame inside `D - Command`.
 *
 * Node tree, in board order:
 *   Section       VERTICAL, padding 6/0, bg/primary
 *     .Menu Item  the "Section Title" row - the same node with its icon,
 *                 caps and chevron switched off
 *     .Menu Item  the options
 *
 * The rule between two Sections is the `Divider` frame that sits between
 * them; it is drawn by EvCommand, not here, so a lone group has no stray rule.
 */
.ev-command__group {
  background-color: var(--ev-bg-primary);
}

.ev-command__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 6px 0;
  list-style: none;
}
</style>
