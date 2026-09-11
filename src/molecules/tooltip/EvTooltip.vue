<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { TooltipPlacement } from '../../types'

defineOptions({
  name: 'EvTooltip',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Which side of the trigger the bubble sits on. */
    placement?: TooltipPlacement
    /** Body text. Use the `content` slot for anything richer. */
    text?: string
    /** Optional bold heading inside the bubble. */
    title?: string
    /** Take control of visibility instead of letting hover and focus drive it. */
    open?: boolean
    /** Renders the close button in the title row. */
    dismissible?: boolean
    closeLabel?: string
  }>(),
  {
    placement: 'top',
    text: undefined,
    title: undefined,
    open: undefined,
    dismissible: false,
    closeLabel: 'Tutup',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

defineSlots<{
  /** The element the tooltip describes. */
  default?: () => unknown
  content?: () => unknown
  title?: () => unknown
  /** Figma's `Slot Title` - a 24px leading slot in the title row. */
  slotTitle?: () => unknown
  /** Figma's `Slot Content` - a block under the message, above the footer. */
  slotContent?: () => unknown
  /** Figma's `.Pagination Step` - step counter plus link buttons. */
  footer?: () => unknown
}>()

const tooltipId = `ev-tooltip-${useId()}`
const hovered = ref(false)

/** Uncontrolled unless `open` is passed, so the common case needs no state. */
const visible = computed(() => props.open ?? hovered.value)

function show() {
  if (props.open === undefined) hovered.value = true
  else emit('update:open', true)
}

function hide() {
  if (props.open === undefined) hovered.value = false
  else emit('update:open', false)
}
</script>

<template>
  <span
    v-bind="$attrs"
    class="ev-tooltip"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <span class="ev-tooltip__trigger" :aria-describedby="visible ? tooltipId : undefined">
      <slot />
    </span>

    <span
      v-show="visible"
      :id="tooltipId"
      class="ev-tooltip__bubble"
      :class="`ev-tooltip__bubble--${placement}`"
      role="tooltip"
    >
      <span class="ev-tooltip__panel">
        <span
          v-if="title || $slots.title || $slots.slotTitle || dismissible"
          class="ev-tooltip__title-row"
        >
          <span v-if="$slots.slotTitle" class="ev-tooltip__slot-title"
            ><slot name="slotTitle"
          /></span>
          <span class="ev-tooltip__title"
            ><slot name="title">{{ title }}</slot></span
          >
          <button
            v-if="dismissible"
            type="button"
            class="ev-tooltip__close"
            :aria-label="closeLabel"
            @click="hide"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.6" fill="none" />
            </svg>
          </button>
        </span>

        <span class="ev-tooltip__body"
          ><slot name="content">{{ text }}</slot></span
        >

        <span v-if="$slots.slotContent" class="ev-tooltip__slot-content"
          ><slot name="slotContent"
        /></span>

        <span v-if="$slots.footer" class="ev-tooltip__footer"><slot name="footer" /></span>
      </span>

      <span class="ev-tooltip__arrow" aria-hidden="true" />
    </span>
  </span>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Tooltip` component set in Figma (4 placements).
 *
 * DEVIATION: the board's arrow art is filled `grey/600` on a `bg/inverse`
 * bubble - and the hidden arrows in the Left and Right variants are filled
 * `modal-scrim` instead. Those look like unmaintained placeholder art rather
 * than intent, and reproducing them would ship a tooltip whose arrow visibly
 * does not match its bubble. The arrow therefore takes `--ev-tooltip-bg`, the
 * same property as the panel, so the two can never drift apart.
 *
 * Placement is pure CSS against the trigger, with no collision detection: a
 * tooltip near a viewport edge will overflow rather than flip.
 */
.ev-tooltip {
  --ev-tooltip-bg: var(--ev-bg-inverse);
  --ev-tooltip-arrow: 8px;

  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }

  &__bubble {
    position: absolute;
    z-index: var(--ev-z-dropdown);
    display: flex;
    /*
     * The board sets the bubble to a FIXED 320, but a floating element that is
     * always 320 wide runs past its container on the `left` placement. Hugging
     * up to 320 reaches the drawn width whenever the message is long enough -
     * the board's own specimen is a 131-character paragraph - and stays inside
     * the container when it is not.
     */
    width: max-content;
    max-width: 320px;
    pointer-events: none;
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
    padding: var(--ev-spacing-lg);
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-tooltip-bg);
    box-shadow: var(--ev-elevation-xl);
  }

  &__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ev-spacing-xs);
  }

  &__title {
    color: var(--ev-text-inverse);

    @include type.style('subheading/h6');
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-text-inverse);
    cursor: pointer;
    pointer-events: auto;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  /* node: Slot Title - a 24x24 leading tile in the title row. */
  &__slot-title {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
  }

  /* node: Slot Content - a VERTICAL g8 block beneath the message. */
  &__slot-content {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
  }

  &__body {
    color: var(--ev-text-inverse);

    @include type.style('body/regular');
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    color: var(--ev-text-inverse);

    @include type.style('body/regular');
  }

  /* The arrow is a rotated square, so it inherits the panel's fill exactly. */
  &__arrow {
    position: absolute;
    width: calc(var(--ev-tooltip-arrow) * 2);
    height: calc(var(--ev-tooltip-arrow) * 2);
    background-color: var(--ev-tooltip-bg);
    transform: rotate(45deg);
  }

  &__bubble--top {
    bottom: calc(100% + var(--ev-tooltip-arrow));
    left: 50%;
    transform: translateX(-50%);

    .ev-tooltip__arrow {
      bottom: calc(var(--ev-tooltip-arrow) * -0.5);
      left: 50%;
      margin-left: calc(var(--ev-tooltip-arrow) * -1);
    }
  }

  &__bubble--bottom {
    top: calc(100% + var(--ev-tooltip-arrow));
    left: 50%;
    transform: translateX(-50%);

    .ev-tooltip__arrow {
      top: calc(var(--ev-tooltip-arrow) * -0.5);
      left: 50%;
      margin-left: calc(var(--ev-tooltip-arrow) * -1);
    }
  }

  &__bubble--left {
    top: 50%;
    right: calc(100% + var(--ev-tooltip-arrow));
    transform: translateY(-50%);

    .ev-tooltip__arrow {
      top: 50%;
      right: calc(var(--ev-tooltip-arrow) * -0.5);
      margin-top: calc(var(--ev-tooltip-arrow) * -1);
    }
  }

  &__bubble--right {
    top: 50%;
    left: calc(100% + var(--ev-tooltip-arrow));
    transform: translateY(-50%);

    .ev-tooltip__arrow {
      top: 50%;
      left: calc(var(--ev-tooltip-arrow) * -0.5);
      margin-top: calc(var(--ev-tooltip-arrow) * -1);
    }
  }
}
</style>
