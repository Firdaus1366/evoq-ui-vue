<script setup lang="ts">
defineOptions({
  name: 'EvPaginationItem',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** The page this tile jumps to. Rendered as its label. */
    page?: number | string
    /** Marks the page currently on screen. */
    active?: boolean
    disabled?: boolean
    /**
     * Figma's `State=More`: the ellipsis tile standing in for a run of hidden
     * pages. It is inert, so it renders as a span rather than a button.
     */
    more?: boolean
    /** Accessible name of the ellipsis tile. */
    moreLabel?: string
  }>(),
  {
    page: undefined,
    active: false,
    disabled: false,
    more: false,
    moreLabel: 'Halaman lainnya',
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <span v-if="more" v-bind="$attrs" class="ev-pagination-item ev-pagination-item--more">
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="3" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="13" cy="8" r="1.4" />
    </svg>
    <span class="ev-pagination-item__sr">{{ moreLabel }}</span>
  </span>
  <button
    v-else
    v-bind="$attrs"
    type="button"
    class="ev-pagination-item"
    :class="{ 'ev-pagination-item--active': active }"
    :disabled="disabled"
    :aria-current="active ? 'page' : undefined"
    @click="emit('click', $event)"
  >
    <slot>{{ props.page }}</slot>
  </button>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.StepNumber` component set in Figma (5 States).
 *
 * Node tree, in board order:
 *   .StepNumber  HORIZONTAL, gap 2, padding 8, 32x32, radius 8
 *     Label      12 Medium - or `more_horiz` 16 on State=More
 *
 * Default has no fill; Active is brand/primary with inverse text; Hover is
 * brand/primary-200 with brand text; Disable keeps no fill and drops the
 * label to text/disabled.
 *
 * Deviation: the board's `more_horiz` glyph is painted #000000, which is in
 * no EVOQ ramp - the icon was never recoloured. It is drawn here in
 * icon/primary, the colour every other trailing glyph on these pages uses.
 */
.ev-pagination-item {
  --ev-pagination-item-bg: transparent;
  --ev-pagination-item-fg: var(--ev-text-primary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ev-spacing-2xs);
  width: 32px;
  height: 32px;
  padding: var(--ev-spacing-sm);
  border: 0;
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-pagination-item-bg);
  color: var(--ev-pagination-item-fg);
  cursor: pointer;
  transition:
    background-color var(--ev-duration-fast) var(--ev-easing-standard),
    color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/small');

  &:hover:not(:disabled):not(.ev-pagination-item--active) {
    --ev-pagination-item-bg: var(--ev-brand-primary-200);
    --ev-pagination-item-fg: var(--ev-brand-primary);
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }

  &--active {
    --ev-pagination-item-bg: var(--ev-brand-primary);
    --ev-pagination-item-fg: var(--ev-text-inverse);
  }

  &:disabled {
    --ev-pagination-item-fg: var(--ev-text-disabled);

    cursor: not-allowed;
  }

  &--more {
    cursor: default;

    svg {
      width: 16px;
      height: 16px;
      fill: var(--ev-icon-primary);
    }
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
</style>
