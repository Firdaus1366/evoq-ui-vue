<script setup lang="ts">
import type { AvatarSize } from '../../types'

defineOptions({
  name: 'EvAvatarGroup',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** Must match the size of the avatars inside - it sets the overlap. */
    size?: AvatarSize
    /** Accessible name for the stack. */
    label?: string
  }>(),
  {
    size: 32,
    label: undefined,
  },
)

defineSlots<{
  /** The avatars. Put an `EvAvatar variant="number"` last for an overflow. */
  default?: () => unknown
}>()
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-avatar-group"
    :class="`ev-avatar-group--${size}`"
    role="group"
    :aria-label="label"
  >
    <slot />
  </div>
</template>

<style lang="scss">
/*
 * Traced from the `AvatarGroup` component set in Figma (6 sizes).
 *
 * Figma expresses the overlap as a negative auto-layout gap. CSS `gap` rejects
 * negative values outright - the declaration would be dropped and nothing would
 * overlap - so it becomes a negative left margin on every avatar after the
 * first, which is the same result.
 *
 * The board's six values are close to but not exactly `size / 3` (40 gives 12,
 * not 13; 64 gives 20, not 21), so they are listed literally: a formula that is
 * almost right is worse than a table that is right.
 */
.ev-avatar-group {
  --ev-avatar-group-overlap: 10px;

  display: inline-flex;
  align-items: center;

  > * + * {
    margin-left: calc(var(--ev-avatar-group-overlap) * -1);
  }

  &--24 {
    --ev-avatar-group-overlap: 8px;
  }

  &--32 {
    --ev-avatar-group-overlap: 10px;
  }

  &--40 {
    --ev-avatar-group-overlap: 12px;
  }

  &--48 {
    --ev-avatar-group-overlap: 16px;
  }

  &--64 {
    --ev-avatar-group-overlap: 20px;
  }

  &--96 {
    --ev-avatar-group-overlap: 32px;
  }
}
</style>
