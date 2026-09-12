<script setup lang="ts">
import { computed } from 'vue'
import type { SidebarItemType } from '../../types'

defineOptions({
  name: 'EvSidebarItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** `Type` of the Figma `.ItemSidebar` set. */
    type?: SidebarItemType
    label?: string
    /** Renders a real link instead of a button. */
    href?: string
    /** Marks the current section. Figma's `State=Active`. */
    active?: boolean
    disabled?: boolean
    /**
     * Collapses the row to a 32px square holding only its icon - what
     * `D - Sidebar` draws in its `Open=No` variant.
     */
    collapsed?: boolean
  }>(),
  {
    type: 'main',
    label: undefined,
    href: undefined,
    active: false,
    disabled: false,
    collapsed: false,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const slots = defineSlots<{
  default?: () => unknown
  icon?: () => unknown
  /** The trailing 16px glyph - a chevron on a row that expands. */
  trailing?: () => unknown
}>()

const tag = computed(() => (props.href ? 'a' : 'button'))
/** Submenu and Sub Submenu draw an 8px bullet inside a 16px box, not an icon. */
const bulleted = computed(() => props.type === 'submenu' || props.type === 'sub-submenu')
</script>

<template>
  <li v-if="type === 'divider'" v-bind="$attrs" class="ev-sidebar-item--divider" role="separator">
    <span class="ev-sidebar-item__rule" />
  </li>

  <li
    v-else-if="type === 'sub-title'"
    v-bind="$attrs"
    class="ev-sidebar-item ev-sidebar-item--sub-title"
  >
    <span class="ev-sidebar-item__label">
      <slot>{{ label }}</slot>
    </span>
  </li>

  <li v-else class="ev-sidebar-item__row">
    <component
      :is="tag"
      v-bind="$attrs"
      class="ev-sidebar-item"
      :class="[
        `ev-sidebar-item--${type}`,
        {
          'ev-sidebar-item--active': active,
          'ev-sidebar-item--disabled': disabled,
          'ev-sidebar-item--collapsed': collapsed,
        },
      ]"
      :href="disabled ? undefined : href"
      :type="tag === 'button' ? 'button' : undefined"
      :disabled="tag === 'button' ? disabled : undefined"
      :aria-current="active ? 'page' : undefined"
      :aria-disabled="disabled || undefined"
      :title="collapsed ? label : undefined"
      @click="!disabled && emit('click', $event)"
    >
      <span v-if="bulleted" class="ev-sidebar-item__bullet" aria-hidden="true">
        <span class="ev-sidebar-item__dot" />
      </span>
      <span v-else class="ev-sidebar-item__icon">
        <slot name="icon">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="4.5" fill="currentColor" />
          </svg>
        </slot>
      </span>

      <span v-if="!collapsed" class="ev-sidebar-item__label">
        <slot>{{ label }}</slot>
      </span>

      <span v-if="!collapsed && slots.trailing" class="ev-sidebar-item__trailing">
        <slot name="trailing" />
      </span>
    </component>
  </li>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.ItemSidebar` component set in Figma (Type x State, 14
 * variants).
 *
 * Node tree, in board order:
 *   .ItemSidebar   HORIZONTAL, gap 4, padding 8, radius 8, transparent, 32 tall
 *     Icon         16 icon/secondary - or, on Submenu, a 16 box holding an 8 dot
 *     Label        Main 14 Medium, Submenu and Sub Submenu 12 Medium
 *     Icon         16 icon/secondary, trailing
 *   Type=Sub Title padding 8/4/8/0, label 12 Medium text/secondary, no icons
 *   Type=Divider   padding 4, 8 tall, a 1px border/primary rule
 *
 * The Active treatment splits by type, exactly as the board draws it: Main
 * takes no fill and bolds its label, while Submenu and Sub Submenu take a
 * brand/primary-subtle fill and go Semi Bold. Hover turns text and leading
 * icon brand on every type without adding a fill; the trailing icon stays
 * icon/secondary throughout.
 *
 * Board inconsistency: Sub Submenu is indented 24 on Default and Active but
 * 16 on Hover and Disabled. An indent that moves on hover is a slip, so 24 -
 * the pair the resting and selected states agree on - is used for all four.
 */
.ev-sidebar-item {
  --ev-sidebar-item-bg: transparent;
  --ev-sidebar-item-fg: var(--ev-text-primary);
  --ev-sidebar-item-icon: var(--ev-icon-secondary);
  --ev-sidebar-item-indent: var(--ev-spacing-sm);

  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-xs);
  width: 100%;
  min-height: 32px;
  padding: var(--ev-spacing-sm) var(--ev-spacing-sm) var(--ev-spacing-sm)
    var(--ev-sidebar-item-indent);
  border: 0;
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-sidebar-item-bg);
  color: var(--ev-sidebar-item-fg);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color var(--ev-duration-fast) var(--ev-easing-standard),
    color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/regular');

  &__row {
    list-style: none;
  }

  &:hover:not(.ev-sidebar-item--disabled) {
    --ev-sidebar-item-fg: var(--ev-brand-primary);
    --ev-sidebar-item-icon: var(--ev-brand-primary);
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-sidebar-item-icon);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  /* The Submenu marker: an 8px dot centred in the same 16px box as an icon. */
  &__bullet {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: var(--ev-radius-rd);
    background-color: var(--ev-sidebar-item-icon);
  }

  &__label {
    flex: 1 1 auto;
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Never brand-tinted - the board keeps it icon/secondary in every state. */
  &__trailing {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-icon-secondary);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &--submenu,
  &--sub-submenu {
    @include type.style('body/small');
  }

  &--sub-submenu {
    --ev-sidebar-item-indent: var(--ev-spacing-xl);
  }

  &--active {
    --ev-sidebar-item-fg: var(--ev-brand-primary);
    --ev-sidebar-item-icon: var(--ev-brand-primary);

    /* Main: no fill, bold label. */
    &.ev-sidebar-item--main {
      font-weight: var(--ev-font-weight-bold);
    }

    /* Submenu and Sub Submenu: a brand-subtle fill and a semi-bold label. */
    &.ev-sidebar-item--submenu,
    &.ev-sidebar-item--sub-submenu {
      --ev-sidebar-item-bg: var(--ev-brand-primary-subtle);

      font-weight: var(--ev-font-weight-semibold);
    }
  }

  &--disabled {
    --ev-sidebar-item-fg: var(--ev-text-disabled);
    --ev-sidebar-item-icon: var(--ev-icon-disabled);

    cursor: not-allowed;
  }

  &--collapsed {
    justify-content: center;
    width: 32px;
    padding-inline: 0;
  }

  /* Type=Sub Title - padding 8/4/8/0, muted 12px, not a control. */
  &--sub-title {
    padding: var(--ev-spacing-sm) var(--ev-spacing-xs) var(--ev-spacing-sm) 0;
    color: var(--ev-text-secondary);
    cursor: default;
    list-style: none;

    @include type.style('body/small');
  }

  /* Type=Divider - 8 tall, 4px padding, a 1px rule. */
  &--divider {
    display: flex;
    align-items: center;
    height: 8px;
    padding: var(--ev-spacing-xs);
    list-style: none;
  }

  &__rule {
    display: block;
    width: 100%;
    height: var(--ev-stroke-xs);
    background-color: var(--ev-border-primary);
  }
}
</style>
