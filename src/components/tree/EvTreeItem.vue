<script setup lang="ts">
import { computed } from 'vue'
import EvCheckbox from '../checkbox/EvCheckbox.vue'

defineOptions({
  name: 'EvTreeItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Nesting depth, 1-8. The design system only draws eight. */
    level?: number
    label?: string
    /**
     * Figma's `Has Child`: the node can be opened, so it gets a chevron.
     * Defaults to true, as the component set does.
     */
    hasChild?: boolean
    expanded?: boolean
    selected?: boolean
    /** Figma's `Has Checkbox`: puts a selection box before the label. */
    hasCheckbox?: boolean
    checked?: boolean
    /** Renders the checkbox's dash, for a partly-selected subtree. */
    indeterminate?: boolean
    /** Accessible name for the checkbox, which has no visible label of its own. */
    checkboxLabel?: string
  }>(),
  {
    level: 1,
    label: undefined,
    hasChild: true,
    expanded: false,
    selected: false,
    hasCheckbox: false,
    checked: false,
    indeterminate: false,
    checkboxLabel: 'Pilih',
  },
)

const emit = defineEmits<{
  'update:expanded': [value: boolean]
  'update:checked': [value: boolean]
  select: []
}>()

defineSlots<{
  default?: () => unknown
  /** Figma's `Has Icon` - a leading glyph before the label. */
  icon?: () => unknown
  /** Figma's `Has Slot` - trailing controls at the end of the row. */
  actions?: () => unknown
}>()

/** The board draws eight levels; deeper nesting reuses the last one. */
const clamped = computed(() => Math.min(Math.max(Math.trunc(props.level), 1), 8))

/**
 * Level 1 sits at 4px and every level after it steps in by 24px. Expressed as
 * a variable so the indent and the surface stay in step.
 */
const indent = computed(() => `${4 + (clamped.value - 1) * 24}px`)

function toggle() {
  emit('update:expanded', !props.expanded)
}

/**
 * The row is focusable and operable from the keyboard: the tree pattern
 * expects Enter to activate a node and the horizontal arrows to open and
 * close it. Without this the row is a `div` that only a mouse can reach.
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select')
    return
  }
  if (!props.hasChild) return
  if (event.key === 'ArrowRight' && !props.expanded) {
    event.preventDefault()
    emit('update:expanded', true)
  } else if (event.key === 'ArrowLeft' && props.expanded) {
    event.preventDefault()
    emit('update:expanded', false)
  }
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-tree-item"
    :class="[`ev-tree-item--lv${clamped}`, { 'ev-tree-item--selected': selected }]"
    :style="{ paddingLeft: indent }"
    role="treeitem"
    tabindex="0"
    :aria-level="clamped"
    :aria-selected="selected"
    :aria-expanded="hasChild ? expanded : undefined"
    @click="emit('select')"
    @keydown="onKeydown"
  >
    <!--
      The chevron is a button so it can be reached on its own, and its click
      must not bubble into the row's select handler.
    -->
    <button
      v-if="hasChild"
      type="button"
      class="ev-tree-item__chevron"
      :class="{ 'ev-tree-item__chevron--open': expanded }"
      tabindex="-1"
      :aria-label="expanded ? 'Tutup' : 'Buka'"
      @click.stop="toggle"
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path
          d="M4.5 6.5L8 10l3.5-3.5"
          stroke="currentColor"
          stroke-width="1.5"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
    <span v-else class="ev-tree-item__chevron-spacer" aria-hidden="true" />

    <EvCheckbox
      v-if="hasCheckbox"
      class="ev-tree-item__checkbox"
      :model-value="checked"
      :indeterminate="indeterminate"
      :aria-label="checkboxLabel"
      @click.stop
      @update:model-value="emit('update:checked', $event)"
    />

    <span class="ev-tree-item__content">
      <span v-if="$slots.icon" class="ev-tree-item__icon"><slot name="icon" /></span>
      <span class="ev-tree-item__label"
        ><slot>{{ label }}</slot></span
      >
    </span>

    <span v-if="$slots.actions" class="ev-tree-item__actions" @click.stop>
      <slot name="actions" />
    </span>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Tree` component set in Figma (24 variants: Level 1-8 x
 * State, plus the Has Child / Has Checkbox / Has Icon / Has Slot booleans).
 *
 * The eight resting surfaces are exactly the `tree/lv1`-`tree/lv8` semantic
 * tokens - that is what those tokens exist for, and it is why the rows theme
 * correctly in dark mode without a second set of rules. Hover and selected are
 * flat across every level, so they are single rules rather than eight.
 */
.ev-tree-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-sm);
  min-height: 24px;
  padding-top: var(--ev-spacing-xs);
  padding-right: var(--ev-spacing-xs);
  padding-bottom: var(--ev-spacing-xs);
  background-color: var(--ev-tree-surface);
  cursor: pointer;

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
  }

  &--lv1 {
    --ev-tree-surface: var(--ev-tree-lv1);
  }

  &--lv2 {
    --ev-tree-surface: var(--ev-tree-lv2);
  }

  &--lv3 {
    --ev-tree-surface: var(--ev-tree-lv3);
  }

  &--lv4 {
    --ev-tree-surface: var(--ev-tree-lv4);
  }

  &--lv5 {
    --ev-tree-surface: var(--ev-tree-lv5);
  }

  &--lv6 {
    --ev-tree-surface: var(--ev-tree-lv6);
  }

  &--lv7 {
    --ev-tree-surface: var(--ev-tree-lv7);
  }

  &--lv8 {
    --ev-tree-surface: var(--ev-tree-lv8);
  }

  &:hover {
    --ev-tree-surface: var(--ev-bg-secondary);
  }

  /* Selected outranks hover, so it comes last. */
  &--selected,
  &--selected:hover {
    --ev-tree-surface: var(--ev-brand-primary-subtle);
  }

  &__chevron,
  &__chevron-spacer {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  /*
   * The board draws a 16px chevron, and the usage doc forbids merging
   * expansion into the row's click target ("Don't mix selection and expansion
   * into one ambiguous click target"). That leaves the chevron as the only
   * pointer affordance for opening a node - and 16px is under the 24px
   * WCAG 2.5.8 minimum. The glyph stays 16px so the row keeps its drawn
   * height; an overlay extends the hit area to 24px without touching layout.
   */
  &__chevron {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-secondary);
    cursor: pointer;
    transition: transform var(--ev-duration-fast) var(--ev-easing-standard);

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
    }

    svg {
      width: 16px;
      height: 16px;
    }

    /* Collapsed points right; the board draws the open state pointing down. */
    &:not(.ev-tree-item__chevron--open) {
      transform: rotate(-90deg);
    }
  }

  /* The board nests a plain Checkbox here, label and subtext switched off. */
  &__checkbox {
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-xs);
    flex: 1;
    min-width: 0;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-icon-secondary);
  }

  &__label {
    color: var(--ev-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @include type.style('body/regular');
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-xs);
    flex-shrink: 0;
  }
}
</style>
