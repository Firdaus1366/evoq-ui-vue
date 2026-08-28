<script setup lang="ts">
import { computed, inject } from 'vue'
import type { TagVariant } from '../../types'
import { TAG_GROUP_KEY } from './context'

defineOptions({
  name: 'EvTag',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    variant?: TagVariant
    /** Renders the trailing dismiss button and enables the `remove` event. */
    removable?: boolean
    /** Accessible name for the dismiss button. */
    removeLabel?: string
  }>(),
  {
    variant: undefined,
    removable: false,
    removeLabel: 'Remove',
  },
)

const group = inject(TAG_GROUP_KEY, null)
const resolvedVariant = computed(() => props.variant ?? group?.variant.value ?? 'default')

const emit = defineEmits<{
  remove: []
}>()

defineSlots<{
  default?: () => unknown
  iconLeft?: () => unknown
}>()

function onRemove() {
  if (props.removable) emit('remove')
}
</script>

<template>
  <span v-bind="$attrs" class="ev-tag" :class="`ev-tag--${resolvedVariant}`">
    <slot name="iconLeft" />
    <span class="ev-tag__label"><slot /></span>
    <button
      v-if="removable"
      type="button"
      class="ev-tag__remove"
      :aria-label="removeLabel"
      @click="onRemove"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" fill="none" />
      </svg>
    </button>
  </span>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Tag` component set in Figma (4 variants: Variant x State).
 * Figma's `State=Hover` maps onto `:hover` of the whole tag, not of the
 * dismiss button.
 */
.ev-tag {
  --ev-tag-bg: var(--ev-bg-subtler);
  --ev-tag-bg-hover: var(--ev-bg-subtlest);
  --ev-tag-border: transparent;

  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--ev-spacing-xs);
  min-height: 24px;
  padding: var(--ev-spacing-xs);
  border: var(--ev-stroke-xs) solid var(--ev-tag-border);
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-tag-bg);
  color: var(--ev-text-primary);
  white-space: nowrap;
  transition: background-color var(--ev-duration-fast) var(--ev-easing-standard);

  @include type.style('body/small');

  &:hover {
    background-color: var(--ev-tag-bg-hover);
  }

  svg {
    flex-shrink: 0;
  }

  /* Transparent at rest, tinted on hover. */
  &--outline {
    --ev-tag-bg: transparent;
    --ev-tag-bg-hover: var(--ev-bg-subtle);
    --ev-tag-border: var(--ev-border-primary);
  }

  &__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    border-radius: var(--ev-radius-2xs);
    background: none;
    color: var(--ev-icon-primary);
    cursor: pointer;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: 1px;
    }
  }
}
</style>
