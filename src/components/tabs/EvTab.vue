<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import { TABS_KEY } from './context'

defineOptions({
  name: 'EvTab',
  inheritAttrs: false,
})

const props = defineProps<{
  /** Value this tab selects. */
  value: string | number
  disabled?: boolean
}>()

defineSlots<{
  default?: () => unknown
  iconLeft?: () => unknown
  iconRight?: () => unknown
}>()

const tabs = inject(TABS_KEY, null)

onMounted(() => tabs?.register(props.value))
onBeforeUnmount(() => tabs?.unregister(props.value))

const selected = computed(() => tabs?.selected.value === props.value)
const variant = computed(() => tabs?.variant.value ?? 'segmented')
const tabId = computed(() => `${tabs?.baseId ?? 'ev-tab'}-tab-${props.value}`)
const panelId = computed(() => `${tabs?.baseId ?? 'ev-tab'}-panel-${props.value}`)

function select() {
  if (props.disabled) return
  tabs?.select(props.value)
}

/**
 * Roving focus: only the selected tab is tabbable, and the arrow keys move
 * between tabs. That is what the tablist pattern expects, and it is the reason
 * the parent tracks registration order.
 */
function onKeydown(event: KeyboardEvent) {
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
  if (!tabs || !keys.includes(event.key)) return

  const values = tabs.values.value
  const current = values.indexOf(props.value)
  if (current === -1) return

  const next =
    event.key === 'ArrowRight'
      ? (current + 1) % values.length
      : event.key === 'ArrowLeft'
        ? (current - 1 + values.length) % values.length
        : event.key === 'Home'
          ? 0
          : values.length - 1

  const target = values[next]
  if (target === undefined) return

  event.preventDefault()
  tabs.select(target)

  const el = document.getElementById(`${tabs.baseId}-tab-${target}`)
  el?.focus()
}
</script>

<template>
  <button
    :id="tabId"
    v-bind="$attrs"
    type="button"
    class="ev-tab"
    :class="[`ev-tab--${variant}`, { 'ev-tab--selected': selected }]"
    role="tab"
    :aria-selected="selected"
    :aria-controls="panelId"
    :tabindex="selected ? 0 : -1"
    :disabled="disabled"
    @click="select"
    @keydown="onKeydown"
  >
    <slot name="iconLeft" />
    <span class="ev-tab__label"><slot /></span>
    <slot name="iconRight" />
  </button>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.TabItem` component set in Figma (Variant x Active).
 *
 * A Line tab reserves its underline at rest as a transparent border, so
 * selecting one does not shift the row by two pixels.
 */
.ev-tab {
  --ev-tab-bg: transparent;
  --ev-tab-fg: var(--ev-text-secondary);
  --ev-tab-icon: var(--ev-icon-secondary);

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ev-spacing-xs);
  min-height: 32px;
  border: 0;
  background-color: var(--ev-tab-bg);
  color: var(--ev-tab-fg);
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--ev-duration-fast) var(--ev-easing-standard),
    border-color var(--ev-duration-fast) var(--ev-easing-standard),
    color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/regular');

  svg {
    color: var(--ev-tab-icon);
    flex-shrink: 0;
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: calc(var(--ev-focus-ring-offset) * -1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--segmented {
    padding: var(--ev-spacing-sm) var(--ev-spacing-md);
    border-radius: var(--ev-radius-sm);

    &.ev-tab--selected {
      --ev-tab-bg: var(--ev-brand-primary);
      --ev-tab-fg: var(--ev-text-inverse);
      --ev-tab-icon: var(--ev-text-inverse);
    }
  }

  &--line {
    padding: var(--ev-spacing-sm);
    border-bottom: var(--ev-stroke-sm) solid transparent;

    &.ev-tab--selected {
      --ev-tab-fg: var(--ev-brand-primary);
      --ev-tab-icon: var(--ev-brand-primary);

      border-bottom-color: var(--ev-brand-primary);
    }
  }
}
</style>
