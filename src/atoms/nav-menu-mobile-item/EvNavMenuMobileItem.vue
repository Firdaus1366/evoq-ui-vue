<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'EvNavMenuMobileItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Marks the current section. Figma models it as the `Active` variant. */
    active?: boolean
    label?: string
    /** Renders an anchor instead of a button. */
    href?: string
  }>(),
  {
    active: false,
    label: undefined,
    href: undefined,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const tag = computed(() => (props.href ? 'a' : 'button'))
</script>

<template>
  <component
    :is="tag"
    v-bind="$attrs"
    class="ev-nav-menu-mobile-item"
    :class="{ 'ev-nav-menu-mobile-item--active': active }"
    :href="href"
    :type="tag === 'button' ? 'button' : undefined"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click', $event)"
  >
    <span class="ev-nav-menu-mobile-item__icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="6" />
        </svg>
      </slot>
    </span>
    <span class="ev-nav-menu-mobile-item__label">
      <slot>{{ label }}</slot>
    </span>
  </component>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.Menu` component set on the Navigation Menu - Mobile page
 * (Active=False / True).
 *
 * Node tree, in board order:
 *   .Menu    VERTICAL, gap 4, padding 8/4, fills its column, 60 tall
 *     Icon   24x24 - icon/secondary, brand when active
 *     Label  12 Medium - text/secondary, brand when active
 *
 * Deviation: the active icon is painted with a linear gradient that matches
 * no ramp entry. It is drawn here in brand/primary, the colour the active
 * label takes on the same node.
 */
.ev-nav-menu-mobile-item {
  --ev-nav-menu-mobile-item-icon: var(--ev-icon-secondary);
  --ev-nav-menu-mobile-item-fg: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex: 1 1 0%;
  flex-direction: column;
  align-items: center;
  gap: var(--ev-spacing-xs);
  min-height: 60px;
  padding: var(--ev-spacing-sm) var(--ev-spacing-xs);
  border: 0;
  background: none;
  color: var(--ev-nav-menu-mobile-item-fg);
  text-decoration: none;
  cursor: pointer;
  transition: color var(--ev-duration-fast) var(--ev-easing-standard);

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }

  &__icon {
    display: inline-flex;
    color: var(--ev-nav-menu-mobile-item-icon);

    svg {
      width: 24px;
      height: 24px;
      fill: currentcolor;
    }
  }

  &__label {
    @include type.style('body/small');
  }

  &--active {
    --ev-nav-menu-mobile-item-icon: var(--ev-brand-primary);
    --ev-nav-menu-mobile-item-fg: var(--ev-brand-primary);
  }
}
</style>
