<script setup lang="ts">
defineOptions({
  name: 'EvNavigationMenu',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Accessible name for the bar. */
    label?: string
  }>(),
  { label: undefined },
)

defineSlots<{
  /** Primary navigation - `EvNavMenuItem`s, or an `EvTabs` for the tab style. */
  default?: () => unknown
  /** The brand mark at the far left. */
  brand?: () => unknown
  /** Figma's `Slot 1`: a flexible insertion point beside the navigation. */
  slot1?: () => unknown
  /** Figma's `Slot 2`: the first item of the right utility cluster. */
  slot2?: () => unknown
  /** Figma's `Has Search`: the global search field. */
  search?: () => unknown
  /** Figma's `Has Profile`: the account item at the far right. */
  profile?: () => unknown
}>()
</script>

<template>
  <nav v-bind="$attrs" class="ev-navigation-menu" :aria-label="label">
    <div class="ev-navigation-menu__start">
      <div v-if="$slots.brand" class="ev-navigation-menu__brand"><slot name="brand" /></div>
      <div class="ev-navigation-menu__nav"><slot /></div>
      <div v-if="$slots.slot1" class="ev-navigation-menu__slot"><slot name="slot1" /></div>
    </div>

    <div class="ev-navigation-menu__end">
      <div v-if="$slots.slot2" class="ev-navigation-menu__slot"><slot name="slot2" /></div>
      <div v-if="$slots.search" class="ev-navigation-menu__search"><slot name="search" /></div>
      <div v-if="$slots.profile" class="ev-navigation-menu__profile"><slot name="profile" /></div>
    </div>
  </nav>
</template>

<style lang="scss">
/*
 * Traced from the `D - NavigationMenu` component in Figma.
 *
 * DOC MISMATCH: the usage doc describes a 56px bar carrying a "BTech logo",
 * with an active link of `#145bc3` and inactive of `#64748b`. The board draws
 * a 72px bar with no logo, and its items use `brand/primary` and
 * `text/secondary`. The board is what is reproduced here; the doc text looks
 * like it was written against an earlier design.
 */
.ev-navigation-menu {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ev-spacing-3xl);
  min-height: 72px;
  padding: var(--ev-spacing-lg) var(--ev-spacing-xl);
  background-color: var(--ev-bg-primary);

  &__start,
  &__end {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-lg);
    min-width: 0;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-lg);
    min-width: 0;
  }

  &__brand,
  &__slot,
  &__search,
  &__profile {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}
</style>
