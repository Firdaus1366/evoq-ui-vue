<script setup lang="ts">
import EvLabelItem from '../../atoms/label-item/EvLabelItem.vue'
import type { ItemType, LabelItemType } from '../../types'

defineOptions({
  name: 'EvItem',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** `Type` of the Figma `Item` set. */
    type?: ItemType
    title?: string
    /** Caption under the title, inside the `.LabelItem` instance. */
    description?: string
    /** Passed straight through to the `.LabelItem` instance. */
    labelType?: LabelItemType
    /** The trailing caption the board draws as a separate `Description` node. */
    trailing?: string
  }>(),
  {
    type: 'default',
    title: undefined,
    description: undefined,
    labelType: 'default',
    trailing: undefined,
  },
)

const slots = defineSlots<{
  default?: () => unknown
  /** Figma's `Has L Icon`. */
  icon?: () => unknown
  /** Figma's `Has Avatar` - the board puts an `Avatar` instance here. */
  avatar?: () => unknown
  /** Figma's `Has Image` - a 32px square, radius 8. */
  image?: () => unknown
  /** Figma's `Has Button`. The board instances a Button; the content is yours. */
  actions?: () => unknown
  /** Figma's `Has R Icon`. */
  trailingIcon?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-item" :class="`ev-item--${type}`">
    <div class="ev-item__label">
      <span v-if="slots.icon" class="ev-item__icon"><slot name="icon" /></span>
      <span v-if="slots.avatar" class="ev-item__avatar"><slot name="avatar" /></span>
      <span v-if="slots.image" class="ev-item__image"><slot name="image" /></span>
      <EvLabelItem
        class="ev-item__text"
        :type="labelType"
        :title="title"
        :description="description"
      >
        <slot>{{ title }}</slot>
      </EvLabelItem>
    </div>

    <div v-if="slots.actions" class="ev-item__actions"><slot name="actions" /></div>
    <span v-if="trailing" class="ev-item__trailing">{{ trailing }}</span>
    <span v-if="slots.trailingIcon" class="ev-item__trailing-icon">
      <slot name="trailingIcon" />
    </span>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Item` component set in Figma (3 Types).
 *
 * Node tree, in board order:
 *   Item            HORIZONTAL, gap 8
 *     Label         HORIZONTAL, gap 8, fills
 *       Icon        16 in a 16-wide box
 *       Avatar      32x32, radius 9999
 *       Image       32x32, radius 8
 *       .LabelItem  the title / caption pair
 *     Button        an instance - slotted, because the control is the caller's
 *     Description   12 Medium text/secondary, trailing
 *     R Icon        16
 *
 * Default has no padding, fill or border. Outline adds padding 8, radius 8
 * and a border/primary border; Muted adds a bg/subtle fill on top of that.
 *
 * The `.LabelItem` is composed, not redrawn - it is an instance on the board.
 */
.ev-item {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-sm);

  &__label {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    gap: var(--ev-spacing-sm);
    min-width: 0;
  }

  &__icon {
    display: inline-flex;
    flex-shrink: 0;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__avatar,
  &__image {
    display: inline-flex;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
  }

  &__image {
    overflow: hidden;
    border-radius: var(--ev-radius-sm);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__text {
    min-width: 0;
  }

  &__actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  &__trailing {
    flex-shrink: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/small');
  }

  &__trailing-icon {
    display: inline-flex;
    flex-shrink: 0;
    color: var(--ev-icon-primary);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &--outline,
  &--muted {
    padding: var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    border-radius: var(--ev-radius-sm);
  }

  &--muted {
    background-color: var(--ev-bg-subtle);
  }
}
</style>
