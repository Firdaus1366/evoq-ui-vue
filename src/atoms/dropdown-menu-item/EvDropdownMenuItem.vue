<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'EvDropdownMenuItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    label?: string
    /** Second line under the label. Figma's `Has Subtext`. */
    subtext?: string
    /** Renders a real link instead of a menu item button. */
    href?: string
    disabled?: boolean
    /** Figma's `State=Error`: a destructive entry, such as Delete. */
    error?: boolean
    /**
     * Figma's `State=Submenu`: the muted 12px row the board uses to head a
     * group of entries. It is a label, not a control.
     */
    submenu?: boolean
    /** Figma's `State=Separator`: a rule between two groups. */
    separator?: boolean
    /** Draws the trailing chevron that says the entry opens a submenu. */
    hasChevron?: boolean
  }>(),
  {
    label: undefined,
    subtext: undefined,
    href: undefined,
    disabled: false,
    error: false,
    submenu: false,
    separator: false,
    hasChevron: false,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const slots = defineSlots<{
  default?: () => unknown
  icon?: () => unknown
  /** Keyboard shortcut caps - the board fills this with `Kbd` instances. */
  kbd?: () => unknown
}>()

const tag = computed(() => (props.href ? 'a' : 'button'))
</script>

<template>
  <li v-if="separator" v-bind="$attrs" class="ev-dropdown-menu-item--separator" role="separator">
    <span class="ev-dropdown-menu-item__rule" />
  </li>

  <li
    v-else-if="submenu"
    v-bind="$attrs"
    class="ev-dropdown-menu-item ev-dropdown-menu-item--submenu"
    role="presentation"
  >
    <span v-if="slots.icon" class="ev-dropdown-menu-item__icon"><slot name="icon" /></span>
    <span class="ev-dropdown-menu-item__label">
      <slot>{{ label }}</slot>
    </span>
    <span v-if="slots.kbd" class="ev-dropdown-menu-item__kbd"><slot name="kbd" /></span>
  </li>

  <li v-else class="ev-dropdown-menu-item__row" role="none">
    <component
      :is="tag"
      v-bind="$attrs"
      class="ev-dropdown-menu-item"
      :class="{
        'ev-dropdown-menu-item--error': error,
        'ev-dropdown-menu-item--disabled': disabled,
      }"
      role="menuitem"
      :href="disabled ? undefined : href"
      :type="tag === 'button' ? 'button' : undefined"
      :disabled="tag === 'button' ? disabled : undefined"
      :aria-disabled="disabled || undefined"
      :tabindex="disabled ? -1 : undefined"
      @click="!disabled && emit('click', $event)"
    >
      <span v-if="slots.icon" class="ev-dropdown-menu-item__icon"><slot name="icon" /></span>
      <span class="ev-dropdown-menu-item__text">
        <span class="ev-dropdown-menu-item__label">
          <slot>{{ label }}</slot>
        </span>
        <span v-if="subtext" class="ev-dropdown-menu-item__subtext">{{ subtext }}</span>
      </span>
      <span v-if="slots.kbd" class="ev-dropdown-menu-item__kbd"><slot name="kbd" /></span>
      <span v-if="hasChevron" class="ev-dropdown-menu-item__chevron">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M6 3.5L10.5 8L6 12.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </component>
  </li>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.DropdownMenu` component set in Figma (6 States).
 *
 * Node tree, in board order:
 *   .DropdownMenu  HORIZONTAL, gap 4, padding 8, fills its column, 32 tall
 *     L Icon       16 - icon/primary
 *     Text         VERTICAL, gap 4
 *       Label      14 Medium, text/primary
 *       Subtext    12 Medium, text/secondary
 *     Slot         HORIZONTAL, gap 2 - the Kbd caps
 *     chevron_right 16 - icon/secondary
 *
 * States: Hover takes bg/secondary; Error turns the label ext/error; Disabled
 * drops label and subtext to text/disabled; Submenu replaces the Text frame
 * with a single muted 12px label (a group heading); Separator is a 1px rule
 * inside a 16 tall row with 8px block padding.
 *
 * The board gives only Hover a radius of 8; Default paints an opaque white
 * fill over a white menu, so its corners never show. The radius is constant
 * here so the hover fill cannot change the row's shape.
 */
.ev-dropdown-menu-item {
  --ev-dropdown-menu-item-bg: transparent;
  --ev-dropdown-menu-item-fg: var(--ev-text-primary);
  --ev-dropdown-menu-item-subtext: var(--ev-text-secondary);
  --ev-dropdown-menu-item-icon: var(--ev-icon-primary);

  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-xs);
  width: 100%;
  min-height: 32px;
  padding: var(--ev-spacing-sm);
  border: 0;
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-dropdown-menu-item-bg);
  color: var(--ev-dropdown-menu-item-fg);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/regular');

  &__row {
    list-style: none;
  }

  &:hover:not(.ev-dropdown-menu-item--disabled):not(.ev-dropdown-menu-item--submenu) {
    --ev-dropdown-menu-item-bg: var(--ev-bg-secondary);
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-dropdown-menu-item-icon);
  }

  &__text {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    min-width: 0;
  }

  &__label {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__subtext {
    color: var(--ev-dropdown-menu-item-subtext);

    @include type.style('body/small');
  }

  &__kbd {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ev-spacing-2xs);
  }

  &__chevron {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-icon-secondary);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &--error {
    --ev-dropdown-menu-item-fg: var(--ev-ext-error);
  }

  &--disabled {
    --ev-dropdown-menu-item-fg: var(--ev-text-disabled);
    --ev-dropdown-menu-item-subtext: var(--ev-text-disabled);

    cursor: not-allowed;
  }

  /* State=Submenu - a muted 12px heading, not a control. */
  &--submenu {
    color: var(--ev-text-secondary);
    cursor: default;
    list-style: none;

    @include type.style('body/small');
  }

  /* State=Separator - 16 tall, 8px block padding, a 1px rule. */
  &--separator {
    display: flex;
    align-items: center;
    height: 16px;
    padding-block: var(--ev-spacing-sm);
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
