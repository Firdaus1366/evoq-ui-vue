<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import type { TooltipPlacement } from '../../types'

defineOptions({
  name: 'EvHoverCard',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** Which side of the trigger the card sits on. */
    placement?: TooltipPlacement
    title?: string
    description?: string
    /** The 10px line under the description. */
    subtext?: string
    /** Milliseconds the pointer has to rest before the card opens. */
    openDelay?: number
    /** Milliseconds before it closes again, so the pointer can cross the gap. */
    closeDelay?: number
    disabled?: boolean
  }>(),
  {
    modelValue: undefined,
    placement: 'bottom',
    title: undefined,
    description: undefined,
    subtext: undefined,
    openDelay: 200,
    closeDelay: 150,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  /** The element the pointer rests on. */
  default?: () => unknown
  /** The whole card body, replacing title / description / subtext. */
  content?: () => unknown
}>()

const id = useId()
const uncontrolled = ref(false)
const controlled = computed(() => props.modelValue !== undefined)
const open = computed(() => (controlled.value ? Boolean(props.modelValue) : uncontrolled.value))

let timer: ReturnType<typeof setTimeout> | undefined

function set(value: boolean) {
  if (!controlled.value) uncontrolled.value = value
  emit('update:modelValue', value)
}

function schedule(value: boolean, delay: number) {
  if (props.disabled) return
  clearTimeout(timer)
  timer = setTimeout(() => set(value), delay)
}

function show() {
  schedule(true, props.openDelay)
}

function hide() {
  schedule(false, props.closeDelay)
}

function hideNow() {
  clearTimeout(timer)
  set(false)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    class="ev-hover-card"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
    @keydown.esc="hideNow"
  >
    <span class="ev-hover-card__trigger" :aria-describedby="open ? id : undefined">
      <slot />
    </span>

    <div
      v-if="open"
      v-bind="$attrs"
      :id="id"
      class="ev-hover-card__panel"
      :class="`ev-hover-card__panel--${placement}`"
      role="tooltip"
    >
      <slot name="content">
        <div class="ev-hover-card__body">
          <p v-if="title" class="ev-hover-card__title">{{ title }}</p>
          <p v-if="description" class="ev-hover-card__description">{{ description }}</p>
          <p v-if="subtext" class="ev-hover-card__subtext">{{ subtext }}</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from `D - HoverCard` on the Hover Card page. It is a single
 * COMPONENT, not a set - the page carries no variants.
 *
 * Node tree, in board order:
 *   D - HoverCard    VERTICAL, gap 16, padding 16, radius 12, bg/primary,
 *                    1px border/primary, elevation/xl, 389 wide
 *     Title          VERTICAL, gap 8
 *       Title        14 Bold, text/primary
 *       Description  14 Medium, text/primary  <- primary, not secondary
 *       Subtext      10 Medium, text/secondary
 *
 * The description keeping text/primary is the board's own choice and is
 * reproduced: only the 10px subtext steps down to text/secondary.
 *
 * The outer gap of 16 only shows once the card holds more than the one Title
 * frame, which is why the body is kept as its own node.
 */
.ev-hover-card {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }

  &__panel {
    position: absolute;
    z-index: 30;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
    width: max-content;
    max-width: 389px;
    padding: var(--ev-spacing-lg);
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    border-radius: var(--ev-radius-md);
    background-color: var(--ev-bg-primary);
    box-shadow: var(--ev-elevation-xl);

    &--top {
      bottom: calc(100% + var(--ev-spacing-sm));
      left: 50%;
      transform: translateX(-50%);
    }

    &--bottom {
      top: calc(100% + var(--ev-spacing-sm));
      left: 50%;
      transform: translateX(-50%);
    }

    &--left {
      top: 50%;
      right: calc(100% + var(--ev-spacing-sm));
      transform: translateY(-50%);
    }

    &--right {
      top: 50%;
      left: calc(100% + var(--ev-spacing-sm));
      transform: translateY(-50%);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('body/regular-b');
  }

  &__description {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('body/regular');
  }

  &__subtext {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/xtrasmall');
  }
}
</style>
