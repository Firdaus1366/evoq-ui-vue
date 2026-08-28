<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { TooltipPlacement } from '../../types'

defineOptions({
  name: 'EvPopover',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    /** Which side of the trigger the panel sits on. */
    placement?: TooltipPlacement
    title?: string
    description?: string
    /** Set false to keep a click outside from closing it. */
    closeOnOutside?: boolean
  }>(),
  {
    modelValue: false,
    placement: 'bottom',
    title: undefined,
    description: undefined,
    closeOnOutside: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

defineSlots<{
  /** Panel body - the board fills it with a small form. */
  default?: () => unknown
  /** The element the popover hangs off. */
  trigger?: (props: { open: boolean; toggle: () => void }) => unknown
  title?: () => unknown
  description?: () => unknown
  /** Figma's `Slot` - a trailing row, usually the actions. */
  footer?: () => unknown
}>()

const root = ref<HTMLElement | null>(null)
const panelId = `ev-popover-${useId()}`

const open = computed(() => props.modelValue)

function toggle() {
  emit('update:modelValue', !props.modelValue)
}

function close() {
  emit('update:modelValue', false)
}

/**
 * A popover does not block the page, so it gets dismissal rather than a focus
 * trap: a click beyond its own subtree, or Escape, puts it away.
 */
function onPointerDown(event: PointerEvent) {
  if (!props.closeOnOutside) return
  if (root.value && !root.value.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  open,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener('pointerdown', onPointerDown, true)
      document.addEventListener('keydown', onKeydown, true)
    } else {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeydown, true)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <span ref="root" v-bind="$attrs" class="ev-popover">
    <span class="ev-popover__trigger">
      <slot name="trigger" :open="open" :toggle="toggle" />
    </span>

    <div
      v-show="open"
      :id="panelId"
      class="ev-popover__panel"
      :class="`ev-popover__panel--${placement}`"
      role="dialog"
      :aria-hidden="!open"
    >
      <div
        v-if="title || description || $slots.title || $slots.description"
        class="ev-popover__heading"
      >
        <p class="ev-popover__title">
          <slot name="title">{{ title }}</slot>
        </p>
        <p v-if="description || $slots.description" class="ev-popover__description">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>

      <div class="ev-popover__body"><slot /></div>

      <div v-if="$slots.footer" class="ev-popover__footer"><slot name="footer" /></div>
    </div>
  </span>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the standalone `D - Popover` component in Figma.
 *
 * Note it is bordered and flat - unlike the tooltip and the modal it carries no
 * elevation, so it reads as attached to the page rather than floating over it.
 * Its title is `body/regular`, a step quieter than a dialog's.
 *
 * Placement is pure CSS against the trigger, with no collision detection: a
 * popover near a viewport edge will overflow rather than flip.
 */
.ev-popover {
  position: relative;
  display: inline-flex;

  &__trigger {
    display: inline-flex;
  }

  &__panel {
    position: absolute;
    z-index: var(--ev-z-dropdown);
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
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('body/regular');
  }

  /* A step lighter than `text/secondary`, as the board draws it. */
  &__description {
    margin: 0;
    color: var(--ev-text-tertiary);

    @include type.style('body/small');
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  &__panel--top {
    bottom: calc(100% + var(--ev-spacing-sm));
    left: 50%;
    transform: translateX(-50%);
  }

  &__panel--bottom {
    top: calc(100% + var(--ev-spacing-sm));
    left: 50%;
    transform: translateX(-50%);
  }

  &__panel--left {
    top: 50%;
    right: calc(100% + var(--ev-spacing-sm));
    transform: translateY(-50%);
  }

  &__panel--right {
    top: 50%;
    left: calc(100% + var(--ev-spacing-sm));
    transform: translateY(-50%);
  }
}
</style>
