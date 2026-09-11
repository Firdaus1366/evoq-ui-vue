<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'EvNavMenuItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Marks the current section. */
    active?: boolean
    /** Renders an anchor instead of a button. */
    href?: string
    /**
     * Figma's `Icon Only` state: a 32px square pill. Give it an `aria-label`,
     * since there is no visible text.
     */
    iconOnly?: boolean
  }>(),
  {
    active: false,
    href: undefined,
    iconOnly: false,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const slots = defineSlots<{
  default?: () => unknown
  icon?: () => unknown
}>()

const tag = computed(() => (props.href ? 'a' : 'button'))

/**
 * The board draws three states, and they differ by whether there is an icon,
 * a label, or both - so the shape follows the content rather than a prop.
 */
const shape = computed(() => {
  if (props.iconOnly) return 'icon'
  return slots.icon ? 'icon-text' : 'text'
})
</script>

<template>
  <component
    :is="tag"
    v-bind="$attrs"
    class="ev-nav-menu-item"
    :class="[`ev-nav-menu-item--${shape}`, { 'ev-nav-menu-item--active': active }]"
    :href="href"
    :type="tag === 'button' ? 'button' : undefined"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click', $event)"
  >
    <span v-if="$slots.icon" class="ev-nav-menu-item__icon"><slot name="icon" /></span>
    <span v-if="!iconOnly" class="ev-nav-menu-item__label"><slot /></span>
  </component>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.TabMenubar` component set in Figma (State x Active).
 *
 * The active treatment is not uniform, and that is deliberate on the board:
 * an icon-and-text item takes a solid brand pill with inverse text, while a
 * text-only item takes no fill at all and just turns brand-blue. Both bold
 * their label. Reproducing that difference is the whole point of the set.
 */
.ev-nav-menu-item {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--ev-spacing-xs);
  min-height: 32px;
  border: 0;
  background: none;
  color: var(--ev-text-secondary);
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ev-duration-fast) var(--ev-easing-standard),
    color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/regular');

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
  }

  /* A square pill, and the only shape with a small radius rather than a full one. */
  &--icon {
    justify-content: center;
    width: 32px;
    padding: var(--ev-spacing-xs);
    border-radius: var(--ev-radius-xs);
  }

  &--icon-text {
    padding: var(--ev-spacing-sm) var(--ev-spacing-md) var(--ev-spacing-sm) var(--ev-spacing-sm);
    border-radius: var(--ev-radius-rd);
  }

  &--text {
    padding: var(--ev-spacing-sm);
    border-radius: var(--ev-radius-rd);
  }

  &--active {
    font-weight: var(--ev-font-weight-bold);

    /* With an icon: a solid brand pill. */
    &.ev-nav-menu-item--icon-text,
    &.ev-nav-menu-item--icon {
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);
    }

    /* Without one: no fill, just brand-blue text. */
    &.ev-nav-menu-item--text {
      color: var(--ev-brand-primary);
    }
  }
}
</style>
