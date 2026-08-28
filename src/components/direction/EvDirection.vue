<script setup lang="ts">
import { useId } from 'vue'

defineOptions({
  name: 'EvDirection',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    title?: string
    subtext?: string
    /**
     * Figma's `Has Icon Right`: the trailing element in the header. On by
     * default - the usage doc says not to hide the close affordance.
     */
    hasHeaderAction?: boolean
    /**
     * Figma's `Has Confirmation Button`: the primary action in the footer.
     * Turn it off for a read-only panel that only needs a dismiss.
     */
    hasConfirm?: boolean
  }>(),
  {
    title: undefined,
    subtext: undefined,
    hasHeaderAction: true,
    hasConfirm: true,
  },
)

defineSlots<{
  /** Figma's `Slot`: the panel body, between the header and the footer. */
  default?: () => unknown
  /** Figma's `Top Slot`: a block above the header. Off by default. */
  topSlot?: () => unknown
  title?: () => unknown
  subtext?: () => unknown
  /**
   * The trailing header element - a close button or a link action. Shown only
   * while `hasHeaderAction` is on.
   */
  headerAction?: () => unknown
  /** The primary action. Rendered only while `hasConfirm` is on. */
  confirm?: () => unknown
  /** The secondary, safe-exit action. */
  cancel?: () => unknown
}>()

const titleId = `ev-direction-title-${useId()}`
</script>

<template>
  <section
    v-bind="$attrs"
    class="ev-direction"
    :aria-labelledby="title || $slots.title ? titleId : undefined"
  >
    <div class="ev-direction__body">
      <div v-if="$slots.topSlot" class="ev-direction__top-slot"><slot name="topSlot" /></div>

      <div class="ev-direction__header">
        <div class="ev-direction__heading">
          <p :id="titleId" class="ev-direction__title">
            <slot name="title">{{ title }}</slot>
          </p>
          <p v-if="subtext || $slots.subtext" class="ev-direction__subtext">
            <slot name="subtext">{{ subtext }}</slot>
          </p>
        </div>

        <div v-if="hasHeaderAction && $slots.headerAction" class="ev-direction__header-action">
          <slot name="headerAction" />
        </div>
      </div>

      <div v-if="$slots.default" class="ev-direction__content"><slot /></div>
    </div>

    <div v-if="$slots.cancel || (hasConfirm && $slots.confirm)" class="ev-direction__footer">
      <slot v-if="hasConfirm" name="confirm" />
      <slot name="cancel" />
    </div>
  </section>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the standalone `Direction` component in Figma.
 *
 * Structurally it is the modal's panel - white body over a `bg/subtle` footer -
 * but it sits in the page rather than over it: no scrim, no focus trap, no
 * scroll lock. Its footer buttons are full-width and stacked, the primary
 * first, as the board draws them.
 */
.ev-direction {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  max-width: 500px;
  border-radius: var(--ev-radius-md);
  background-color: var(--ev-bg-primary);
  box-shadow: var(--ev-elevation-md);
  overflow: hidden;

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
    padding: var(--ev-spacing-lg);
    background-color: var(--ev-bg-primary);
  }

  /* The board's `Wrapper` row uses itemSpacing 10 - off the 4px scale. */
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  /* node: Top Slot - VERTICAL, gap 12. */
  &__top-slot {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-md);
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0;
    color: var(--ev-text-primary);

    @include type.style('subheading/h5');
  }

  &__subtext {
    margin: 0;
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }

  &__header-action {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-md);
  }

  /* The one band that is not white, and the only place the actions live. */
  &__footer {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
    padding: var(--ev-spacing-lg);
    background-color: var(--ev-bg-subtle);

    > * {
      width: 100%;
    }
  }
}
</style>
