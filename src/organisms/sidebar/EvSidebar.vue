<script setup lang="ts">
import EvButton from '../../atoms/button/EvButton.vue'
import EvInputSearch from '../../atoms/input-search/EvInputSearch.vue'
import EvLogo from '../../atoms/logo/EvLogo.vue'

defineOptions({
  name: 'EvSidebar',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Figma's `Open=No`: the 64px rail that keeps only the icons. */
    collapsed?: boolean
    /**
     * Follow `M - Sidebar` instead of `D - Sidebar`: an account row and a
     * full-width search where the desktop board puts the logo.
     */
    mobile?: boolean
    /** Figma's `Search` frame. */
    searchable?: boolean
    searchValue?: string
    searchPlaceholder?: string
    /** The toggle's accessible name. */
    toggleLabel?: string
    label?: string
  }>(),
  {
    collapsed: false,
    mobile: false,
    searchable: true,
    searchValue: '',
    searchPlaceholder: 'Search',
    toggleLabel: 'Buka atau tutup sidebar',
    label: 'Sidebar',
  },
)

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
  'update:searchValue': [value: string]
}>()

const slots = defineSlots<{
  /** The navigation - `EvSidebarItem` instances. */
  default?: () => unknown
  /** Replaces the logo (desktop) or the account row (mobile) in the header. */
  header?: () => unknown
  /** Figma's `Slot`: the flexible area under the navigation. */
  footer?: () => unknown
}>()
</script>

<template>
  <aside
    v-bind="$attrs"
    class="ev-sidebar"
    :class="{ 'ev-sidebar--collapsed': collapsed, 'ev-sidebar--mobile': mobile }"
    :aria-label="label"
  >
    <div class="ev-sidebar__header">
      <slot name="header">
        <EvLogo
          class="ev-sidebar__logo"
          :variant="collapsed ? 'mark' : 'lockup'"
          :size="collapsed ? 32 : 34"
        />
      </slot>
      <EvButton
        v-if="mobile"
        class="ev-sidebar__toggle"
        variant="secondary-light"
        size="small"
        icon-only
        :aria-label="toggleLabel"
        @click="emit('update:collapsed', !collapsed)"
      >
        <template #iconLeft>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M2.5 4h11M2.5 8h11M2.5 12h11"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </template>
      </EvButton>
    </div>

    <div v-if="searchable" class="ev-sidebar__search">
      <EvInputSearch
        v-if="!collapsed"
        class="ev-sidebar__field"
        :model-value="searchValue"
        :placeholder="searchPlaceholder"
        @update:model-value="emit('update:searchValue', $event)"
      />
      <EvButton
        v-if="!mobile"
        class="ev-sidebar__toggle"
        variant="secondary-light"
        :size="collapsed ? 'small' : 'default'"
        icon-only
        :aria-label="toggleLabel"
        :aria-expanded="!collapsed"
        @click="emit('update:collapsed', !collapsed)"
      >
        <template #iconLeft>
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M2.5 4h11M2.5 8h11M2.5 12h11"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </template>
      </EvButton>
    </div>

    <ul class="ev-sidebar__nav">
      <slot />
    </ul>

    <div v-if="slots.footer" class="ev-sidebar__footer"><slot name="footer" /></div>
  </aside>
</template>

<style lang="scss">
/*
 * Traced from `D - Sidebar` (Open=Yes / No) and `M - Sidebar` on the Sidebar
 * page. Every control on both is an instance, so the logo, the search field
 * and the toggle are composed rather than redrawn.
 *
 * Node tree, in board order (D - Sidebar, Open=Yes):
 *   D - Sidebar     VERTICAL, gap 16, padding 16, bg/primary, 258 wide
 *     EVOQ-Logo     the lockup instance, 34 tall
 *     Search        HORIZONTAL, gap 8
 *       InputSearch one instance, fills
 *       Button      40x40, secondary-light, icon only
 *     Frame 2       the .ItemSidebar rows
 *     Slot          fills the rest of the column
 *     Scroll        2 wide
 *
 * Open=No narrows the rail to 64, swaps the lockup for the 32px mark, drops
 * the search field, and shrinks the toggle to 32x32 - the small Button size.
 *
 * M - Sidebar keeps the 258 width and replaces the logo with an `Item`
 * instance (avatar plus name and email) beside a 32x32 toggle, then gives
 * the search field the full width of the column.
 *
 * The `Scroll` rail is not drawn: it is a 2px decoration on the board, and
 * the navigation has to hand real scrolling to the browser to stay reachable
 * by keyboard and touch.
 */
.ev-sidebar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-lg);
  width: 258px;
  height: 100%;
  padding: var(--ev-spacing-lg);
  background-color: var(--ev-bg-primary);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    min-height: 34px;
  }

  &__logo {
    flex-shrink: 0;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  &__field {
    flex: 1 1 auto;
    min-width: 0;
  }

  & &__toggle {
    flex-shrink: 0;
  }

  &__toggle svg {
    width: 16px;
    height: 16px;
  }

  &__nav {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-height: 0;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }

  &__footer {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
  }

  /* Open=No: a 64px rail. Padding stays 16, which is what leaves the 32px item. */
  &--collapsed {
    width: 64px;
  }

  &--collapsed &__header,
  &--collapsed &__search {
    justify-content: center;
  }

  &--mobile &__header {
    justify-content: space-between;
  }
}
</style>
