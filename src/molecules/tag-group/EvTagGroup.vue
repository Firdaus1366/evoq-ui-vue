<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import type { TagVariant } from '../../types'
import { TAG_GROUP_KEY } from './context'

/*
 * Compiled 1:1 from the Figma node `Tag / TagGroup` (COMPONENT_SET, 8 variants:
 * Variant x Spacing x Type). Every variant is a HORIZONTAL auto-layout with no
 * padding; only three things move:
 *
 *   Spacing=Default -> itemSpacing 4      Spacing=Loose -> itemSpacing 8
 *   Type=Scroll     -> NO_WRAP + clipsContent (one line, scrolls)
 *   Type=Wrap       -> WRAP, counterAxisSpacing tracking itemSpacing (4 / 8)
 *
 * `Variant` cascades to the tags inside, which is why it is provided rather
 * than drawn here - the group itself paints nothing.
 */

defineOptions({
  name: 'EvTagGroup',
})

const props = withDefaults(
  defineProps<{
    /** Cascades to every `EvTag` inside that does not set its own. */
    variant?: TagVariant
    /** Figma's `Spacing`: 4px (`default`) or 8px (`loose`). */
    spacing?: 'default' | 'loose'
    /** Figma's `Type`: wrap onto more lines, or one line that scrolls. */
    type?: 'wrap' | 'scroll'
    /** Accessible name for the group. */
    label?: string
  }>(),
  {
    variant: undefined,
    spacing: 'default',
    type: 'wrap',
    label: undefined,
  },
)

provide(TAG_GROUP_KEY, { variant: computed(() => props.variant) })

defineSlots<{
  default?: () => unknown
}>()

const spacingRef = toRef(props, 'spacing')
const typeRef = toRef(props, 'type')
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-tag-group"
    :class="[`ev-tag-group--spacing-${spacingRef}`, `ev-tag-group--type-${typeRef}`]"
    role="group"
    :aria-label="label"
  >
    <slot />
  </div>
</template>

<style lang="scss">
.ev-tag-group {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0;

  /* Spacing=Default - itemSpacing 4, and counterAxisSpacing 4 when wrapping. */
  &--spacing-default {
    gap: var(--ev-spacing-xs);
  }

  /* Spacing=Loose - itemSpacing 8, and counterAxisSpacing 8 when wrapping. */
  &--spacing-loose {
    gap: var(--ev-spacing-sm);
  }

  &--type-wrap {
    flex-wrap: wrap;
  }

  /* Type=Scroll - NO_WRAP with clipsContent, so the row scrolls instead. */
  &--type-scroll {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ev-border-secondary) transparent;

    &::-webkit-scrollbar {
      height: 2px;
    }

    &::-webkit-scrollbar-track {
      background-color: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--ev-border-secondary);
      border-radius: var(--ev-radius-sm);
    }
  }
}
</style>
