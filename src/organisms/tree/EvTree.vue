<script setup lang="ts">
defineOptions({
  name: 'EvTree',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Accessible name for the tree. */
    label?: string
  }>(),
  { label: undefined },
)

defineSlots<{
  default?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-tree" role="tree" :aria-label="label">
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * The container for `EvTreeItem`. The Figma page only draws the rows, so this
 * exists to carry the `tree` role the rows' `treeitem` needs to sit inside.
 */
.ev-tree {
  display: flex;
  flex-direction: column;
}
</style>
