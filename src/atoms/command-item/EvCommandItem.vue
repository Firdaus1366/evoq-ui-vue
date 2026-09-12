<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'EvCommandItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    label?: string
    /** Renders a real link instead of an option button. */
    href?: string
    /** Figma's `State=Active`: the row currently chosen, marked with a check. */
    active?: boolean
    disabled?: boolean
    /**
     * The board builds its "Section Title" rows out of this same node with
     * every icon and cap switched off. A heading is not selectable.
     */
    heading?: boolean
    /** Draws the trailing chevron instead of nothing. Ignored when active. */
    hasChevron?: boolean
  }>(),
  {
    label: undefined,
    href: undefined,
    active: false,
    disabled: false,
    heading: false,
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

const tag = computed(() => {
  if (props.heading) return 'div'
  return props.href ? 'a' : 'button'
})
</script>

<template>
  <li class="ev-command-item__row" role="none">
    <component
      :is="tag"
      v-bind="$attrs"
      class="ev-command-item"
      :class="{
        'ev-command-item--active': active,
        'ev-command-item--disabled': disabled,
        'ev-command-item--heading': heading,
      }"
      :role="heading ? 'presentation' : 'option'"
      :href="heading || disabled ? undefined : href"
      :type="tag === 'button' ? 'button' : undefined"
      :disabled="tag === 'button' ? disabled : undefined"
      :aria-selected="heading ? undefined : active"
      :aria-disabled="disabled || undefined"
      @click="!disabled && !heading && emit('click', $event)"
    >
      <span v-if="slots.icon" class="ev-command-item__icon"><slot name="icon" /></span>
      <span class="ev-command-item__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="slots.kbd" class="ev-command-item__kbd"><slot name="kbd" /></span>
      <span v-if="active" class="ev-command-item__check">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M3.5 8.5L6.5 11.5L12.5 4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span v-else-if="hasChevron" class="ev-command-item__chevron">
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
 * Traced from the `.Menu Item` component set on the Command page (4 States).
 *
 * Node tree, in board order:
 *   .Menu Item      HORIZONTAL, gap 8, padding 8, fills its column, 32 tall
 *     L Icon        16 - icon/primary, brand when active
 *     Label         14 Medium, text/primary - brand when active
 *     Slot          HORIZONTAL, gap 2 - the Kbd caps, brand-filled when active
 *     chevron_right 16 icon/secondary, replaced by `check` when active
 *
 * Active takes brand/primary-subtle. Hover takes bg/secondary and a radius
 * of 8 - the radius is constant here for the same reason as DropdownMenu:
 * Default paints opaque white over a white panel, so its corners never show.
 *
 * Deviation: the board's Disabled variant is pixel-identical to Default - the
 * state was drawn but never styled. A row that cannot be chosen has to look
 * that way, so it takes text/disabled and icon/disabled here.
 */
.ev-command-item {
  --ev-command-item-bg: transparent;
  --ev-command-item-fg: var(--ev-text-primary);
  --ev-command-item-icon: var(--ev-icon-primary);

  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-sm);
  width: 100%;
  min-height: 32px;
  padding: var(--ev-spacing-sm);
  border: 0;
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-command-item-bg);
  color: var(--ev-command-item-fg);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/regular');

  &__row {
    list-style: none;
  }

  &:hover:not(.ev-command-item--disabled):not(.ev-command-item--heading):not(
      .ev-command-item--active
    ) {
    --ev-command-item-bg: var(--ev-bg-secondary);
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-command-item-icon);
  }

  &__label {
    flex: 1 1 auto;
    overflow: hidden;
    min-width: 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__kbd {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ev-spacing-2xs);
  }

  &__check {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-brand-primary);

    svg {
      width: 16px;
      height: 16px;
    }
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

  &--active {
    --ev-command-item-bg: var(--ev-brand-primary-subtle);
    --ev-command-item-fg: var(--ev-brand-primary);
    --ev-command-item-icon: var(--ev-brand-primary);
  }

  &--disabled {
    --ev-command-item-fg: var(--ev-text-disabled);
    --ev-command-item-icon: var(--ev-icon-disabled);

    cursor: not-allowed;
  }

  &--heading {
    cursor: default;
  }
}
</style>
