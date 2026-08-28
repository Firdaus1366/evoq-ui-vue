<script setup lang="ts">
defineOptions({
  name: 'EvDropdownList',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Figma's `Has Search`: turns the list into the Combobox pattern. */
    searchable?: boolean
    searchValue?: string
    searchPlaceholder?: string
    /**
     * Figma's `Has Scroll`: caps the visible height. Off by default - the doc
     * says scrolling still works without it. Override the cap itself with
     * `--ev-dropdown-list-max-height`.
     */
    scrollable?: boolean
    /** Accessible name for the option list. */
    label?: string
  }>(),
  {
    searchable: false,
    searchValue: '',
    searchPlaceholder: 'Cari...',
    scrollable: false,
    label: undefined,
  },
)

defineEmits<{
  'update:searchValue': [value: string]
}>()

defineSlots<{
  /** The options. */
  default?: () => unknown
  /**
   * Figma's `Not Found` variant. Render it instead of the options when a
   * search returns nothing.
   */
  empty?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-dropdown-list">
    <div v-if="searchable" class="ev-dropdown-list__search">
      <input
        class="ev-dropdown-list__search-input"
        type="search"
        :value="searchValue"
        :placeholder="searchPlaceholder"
        :aria-label="searchPlaceholder"
        @input="$emit('update:searchValue', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <ul
      class="ev-dropdown-list__options"
      :class="{ 'ev-dropdown-list__options--scrollable': scrollable }"
      role="listbox"
      :aria-label="label"
    >
      <slot />
    </ul>

    <div v-if="$slots.empty" class="ev-dropdown-list__empty"><slot name="empty" /></div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `DropdownList` component set in Figma.
 *
 * The board's `Number of List` property (1-10) is a sizing device for the
 * canvas, not an API: its own documentation says "in code the list is
 * data-driven". So the count is not a prop here - the options are whatever is
 * slotted in.
 */
.ev-dropdown-list {
  --ev-dropdown-list-max-height: 240px;

  box-sizing: border-box;
  padding: var(--ev-spacing-xs) 0;
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-xs);
  background-color: var(--ev-bg-primary);
  box-shadow: var(--ev-elevation-md);

  &__search {
    padding: var(--ev-spacing-sm) var(--ev-spacing-md);
  }

  &__search-input {
    box-sizing: border-box;
    width: 100%;
    padding: var(--ev-spacing-md);
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-bg-primary);
    color: var(--ev-text-primary);

    @include type.style('body/regular');

    &::placeholder {
      color: var(--ev-text-secondary);
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: calc(var(--ev-focus-ring-offset) * -1);
    }
  }

  &__options {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Only capped when asked for; scrolling works either way. */
  &__options--scrollable {
    max-height: var(--ev-dropdown-list-max-height);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ev-border-tertiary) transparent;

    &::-webkit-scrollbar {
      width: var(--ev-stroke-sm);
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: var(--ev-radius-sm);
      background-color: var(--ev-border-tertiary);
    }
  }

  &__empty {
    padding: var(--ev-spacing-xs) var(--ev-spacing-sm);
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }
}
</style>
