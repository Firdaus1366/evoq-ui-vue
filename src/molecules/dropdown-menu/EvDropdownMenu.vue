<script setup lang="ts">
import EvInputSearch from '../../atoms/input-search/EvInputSearch.vue'

defineOptions({
  name: 'EvDropdownMenu',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Figma's `Search` frame, hidden by default on the board. */
    searchable?: boolean
    searchValue?: string
    searchPlaceholder?: string
    /** Caps the list and lets it scroll. The board's `Scroll` rail is 320 tall. */
    maxHeight?: number | string
    /** Accessible name for the menu. */
    label?: string
  }>(),
  {
    searchable: false,
    searchValue: '',
    searchPlaceholder: 'Cari...',
    maxHeight: undefined,
    label: undefined,
  },
)

const emit = defineEmits<{
  'update:searchValue': [value: string]
}>()

defineSlots<{
  /** The rows - `EvDropdownMenuItem` instances. */
  default?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-dropdown-menu">
    <div v-if="searchable" class="ev-dropdown-menu__search">
      <EvInputSearch
        :model-value="searchValue"
        :placeholder="searchPlaceholder"
        @update:model-value="emit('update:searchValue', $event)"
      />
    </div>

    <div class="ev-dropdown-menu__container">
      <ul
        class="ev-dropdown-menu__content"
        role="menu"
        :aria-label="label"
        :style="
          maxHeight
            ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
            : undefined
        "
      >
        <slot />
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `DropdownMenu` COMPONENT on the Dropdown Menu page - the
 * page's only component set, `.DropdownMenu`, is the row (EvDropdownMenuItem).
 *
 * Node tree, in board order:
 *   DropdownMenu   VERTICAL, padding 4/4/4/0, radius 6, bg/primary,
 *                  1px border/primary, elevation/md, 210 wide
 *     Search       VERTICAL, gap 10, padding 8/8/8/12 - hidden by default,
 *                  holds one InputSearch instance
 *     Container    HORIZONTAL, gap 2, space-between
 *       Content    VERTICAL, padding 0/4/0/4 - the .DropdownMenu rows
 *       Scroll     2 wide - hidden by default
 *
 * The asymmetric root padding is real: the left inset comes from Content's
 * own 4px instead, which is what leaves room for the 2px scroll rail on the
 * right without the rows shifting.
 *
 * The rail itself is not drawn. It is hidden on every variant of the board,
 * and a real overflow container has to hand scrolling to the browser so the
 * list stays keyboard- and touch-scrollable.
 */
.ev-dropdown-menu {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--ev-spacing-xs) var(--ev-spacing-xs) var(--ev-spacing-xs) 0;
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-xs);
  background-color: var(--ev-bg-primary);
  box-shadow: var(--ev-elevation-md);

  &__search {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: var(--ev-spacing-sm) var(--ev-spacing-sm) var(--ev-spacing-sm) var(--ev-spacing-md);
  }

  &__container {
    display: flex;
    gap: var(--ev-spacing-2xs);
    justify-content: space-between;
    min-height: 0;
  }

  &__content {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;
    margin: 0;
    padding: 0 var(--ev-spacing-xs);
    overflow-y: auto;
    list-style: none;
  }
}
</style>
