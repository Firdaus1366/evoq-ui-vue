<script setup lang="ts">
import type { CardType } from '../../types'

defineOptions({
  name: 'EvCard',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    type?: CardType
    title?: string
    description?: string
  }>(),
  {
    type: 'default',
    title: undefined,
    description: undefined,
  },
)

defineSlots<{
  /** Card body. */
  default?: () => unknown
  /** Media strip above the body. Only rendered by the `image` type. */
  image?: () => unknown
  title?: () => unknown
  description?: () => unknown
  /** Inline header slot that sits right after the title (Figma's `Slot 1`). */
  headerSlot?: () => unknown
  /** Trailing control in the header row, beside the title block (Figma's `Slot 2`). */
  headerAction?: () => unknown
  /** Footer action strip. Not rendered for `small` type per Figma specification. */
  footer?: () => unknown
}>()
</script>

<template>
  <section v-bind="$attrs" class="ev-card" :class="`ev-card--${type}`">
    <div v-if="type === 'image' && $slots.image" class="ev-card__image">
      <slot name="image" />
    </div>

    <div class="ev-card__body">
      <div
        v-if="
          title ||
          description ||
          $slots.title ||
          $slots.description ||
          $slots.headerSlot ||
          $slots.headerAction
        "
        class="ev-card__header-row"
      >
        <div class="ev-card__header">
          <div class="ev-card__title-row">
            <p v-if="title || $slots.title" class="ev-card__title">
              <slot name="title">{{ title }}</slot>
            </p>
            <div v-if="$slots.headerSlot" class="ev-card__header-slot">
              <slot name="headerSlot" />
            </div>
          </div>
          <p v-if="description || $slots.description" class="ev-card__description">
            <slot name="description">{{ description }}</slot>
          </p>
        </div>
        <div v-if="$slots.headerAction" class="ev-card__header-action">
          <slot name="headerAction" />
        </div>
      </div>

      <div v-if="$slots.default" class="ev-card__content"><slot /></div>

      <div v-if="$slots.footer && type !== 'small'" class="ev-card__footer">
        <slot name="footer" />
      </div>
    </div>
  </section>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `Card` component set in Figma (3 types).
 *
 * `image` is `default` with the padding moved off the outer frame and onto the
 * body, so the media can run edge to edge under the rounded corner. That is why
 * the body is a separate element rather than the card itself.
 */
.ev-card {
  --ev-card-pad: var(--ev-spacing-lg);
  --ev-card-gap: var(--ev-spacing-lg);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-lg);
  background-color: var(--ev-bg-primary);
  overflow: hidden;

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--ev-card-gap);
    padding: var(--ev-card-pad);
  }

  &__image {
    display: block;

    > img,
    > video {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ev-spacing-lg);
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    min-width: 0;
  }

  &__title-row {
    display: inline-flex;
    align-items: center;
    gap: var(--ev-spacing-xs);
    min-width: 0;
  }

  &__header-slot {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  /* The board draws Default and Image at subheading/h6; only Small steps down. */
  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('subheading/h6');
  }

  &__description {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  /* Small tightens every measurement and drops the description a step. */
  &--small {
    --ev-card-pad: var(--ev-spacing-md);
    --ev-card-gap: var(--ev-spacing-md);

    border-radius: var(--ev-radius-sm);

    .ev-card__header {
      gap: var(--ev-spacing-2xs);
    }

    .ev-card__title {
      @include type.style('body/regular');
    }

    .ev-card__description {
      @include type.style('body/small');
    }
  }

  /* The media sits flush; only the body below it is padded. */
  &--image {
    .ev-card__body {
      padding: 0 var(--ev-card-pad) var(--ev-card-pad);
    }
  }
}
</style>
