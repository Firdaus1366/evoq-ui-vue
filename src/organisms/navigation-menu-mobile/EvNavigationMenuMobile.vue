<script setup lang="ts">
defineOptions({
  name: 'EvNavigationMenuMobile',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /**
     * Figma's `M - NavigationMenu CenterButton`: a raised round action in the
     * middle of the bar, with a gap in the row where it sits.
     */
    centerButton?: boolean
    centerLabel?: string
    label?: string
  }>(),
  {
    centerButton: false,
    centerLabel: 'Tambah',
    label: 'Navigasi',
  },
)

const emit = defineEmits<{
  'center-click': [event: MouseEvent]
}>()

defineSlots<{
  /** The items left of the centre action - `EvNavMenuMobileItem` instances. */
  default?: () => unknown
  /** The items right of it. Only read when `centerButton` is set. */
  after?: () => unknown
  /** The glyph inside the centre action. */
  center?: () => unknown
}>()
</script>

<template>
  <nav
    v-bind="$attrs"
    class="ev-navigation-menu-mobile"
    :class="{ 'ev-navigation-menu-mobile--center': centerButton }"
    :aria-label="label"
  >
    <div class="ev-navigation-menu-mobile__row">
      <slot />
      <span v-if="centerButton" class="ev-navigation-menu-mobile__space" aria-hidden="true" />
      <slot name="after" />

      <span v-if="centerButton" class="ev-navigation-menu-mobile__wrapper">
        <button
          type="button"
          class="ev-navigation-menu-mobile__action"
          :aria-label="centerLabel"
          @click="emit('center-click', $event)"
        >
          <slot name="center">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 5v14M5 12h14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </slot>
        </button>
      </span>
    </div>
  </nav>
</template>

<style lang="scss">
/*
 * Traced from `M - NavigationMenu` (Size 5 / 4 / 3 / 2) and
 * `M - NavigationMenu CenterButton` (Size 5 / 3 / 1) on the
 * Navigation Menu - Mobile page.
 *
 * Node tree, in board order:
 *   M - NavigationMenu  VERTICAL, padding 8/0/48/0, bg/primary,
 *                       radius 12/12/0/0, 393 wide, 116 tall
 *     Frame 4           HORIZONTAL, padding 0/16, 60 tall - the .Menu items
 *   CenterButton adds, in this order:
 *     Subtract          the bar shape with a notch cut for the action
 *     Frame 4           the same row, with a `Space` frame in the middle
 *       Wrappr          56x56, its own elevation/sm shadow
 *         Center Action 56x56 disc, padding 16, a 24 glyph
 *
 * The `Size` variants are the item count - 2 to 5 - which is the number of
 * items you slot in, not a prop. Each `.Menu` fills its share of the row.
 *
 * The 48px bottom padding is the phone's home indicator inset, kept as drawn.
 *
 * Off-system colour: the centre action is #08a94c under a linear gradient,
 * and that green is in no EVOQ ramp. It is asserted as a literal.
 *
 * Deviation: the board cuts the notch out of the bar with a boolean shape.
 * A mask that size is fragile across browsers, so the action here sits above
 * the bar in a ring of the bar's own fill - the same silhouette, drawn with
 * a border instead of a cut-out.
 */
.ev-navigation-menu-mobile {
  --ev-navigation-menu-mobile-action: #08a94c;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: var(--ev-spacing-sm) 0 var(--ev-spacing-3xl);
  border-radius: var(--ev-radius-md) var(--ev-radius-md) 0 0;
  background-color: var(--ev-bg-primary);
  /* Not an elevation token - the board casts it upward, from 0,-6 and 0,-1. */
  box-shadow:
    0 -6px 30px 0 rgb(var(--ev-shadow-tint) / 0.1),
    0 -1px 2px -1px rgb(var(--ev-shadow-tint) / 0.06);

  &__row {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 60px;
    padding-inline: var(--ev-spacing-lg);
  }

  /* The `Space` frame: one item's worth of room for the raised action. */
  &__space {
    flex: 1 1 0%;
  }

  &__wrapper {
    position: absolute;
    bottom: 50%;
    left: 50%;
    display: inline-flex;
    transform: translateX(-50%);
    border-radius: var(--ev-radius-rd);
    box-shadow: var(--ev-elevation-sm);
  }

  &__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    padding: var(--ev-spacing-lg);
    /* Stands in for the notch the board cuts out of the bar. */
    border: var(--ev-spacing-xs) solid var(--ev-bg-primary);
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-navigation-menu-mobile-action);
    color: var(--ev-text-inverse);
    cursor: pointer;

    svg {
      width: 24px;
      height: 24px;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }
}
</style>
