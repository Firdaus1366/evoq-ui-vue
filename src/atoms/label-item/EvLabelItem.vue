<script setup lang="ts">
import type { LabelItemType } from '../../types'

defineOptions({
  name: 'EvLabelItem',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** `Type` of the Figma `.LabelItem` set - it only changes the caption size. */
    type?: LabelItemType
    title?: string
    /**
     * Caption under the title. Figma names the node `Description` on Default
     * and `Label` on the two small types; it is one slot here.
     */
    description?: string
  }>(),
  {
    type: 'default',
    title: undefined,
    description: undefined,
  },
)

const slots = defineSlots<{
  default?: () => unknown
  description?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-label-item" :class="`ev-label-item--${type}`">
    <span class="ev-label-item__title">
      <slot>{{ title }}</slot>
    </span>
    <span v-if="description || slots.description" class="ev-label-item__description">
      <slot name="description">{{ description }}</slot>
    </span>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.LabelItem` component set in Figma (3 variants).
 *
 * Node tree, in board order:
 *   .LabelItem     VERTICAL, gap 2, no padding
 *     Title        14 Bold, text/primary - the same on all three types
 *     Description  Default 12, Small 10, Extra Small 8/12 - text/secondary
 *
 * Only the caption changes between types; the title never does.
 */
.ev-label-item {
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-2xs);
  min-width: 0;

  &__title {
    color: var(--ev-text-primary);

    @include type.style('body/regular-b');
  }

  &__description {
    color: var(--ev-text-secondary);
  }

  &--default &__description {
    @include type.style('body/small');
  }

  &--small &__description {
    @include type.style('body/xtrasmall');
  }

  &--extra-small &__description {
    @include type.style('body/micro');
  }
}
</style>
