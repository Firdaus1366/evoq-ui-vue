<script setup lang="ts">
import EvInputSearch from '../../atoms/input-search/EvInputSearch.vue'

defineOptions({
  name: 'EvCommand',
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    /** The search field's value. */
    modelValue?: string
    placeholder?: string
    /** Caps the list and lets it scroll. The board draws two 140-tall Sections. */
    maxHeight?: number | string
    label?: string
  }>(),
  {
    modelValue: '',
    placeholder: 'Type a command to search',
    maxHeight: undefined,
    label: 'Command',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

defineSlots<{
  /** The `EvCommandGroup` sections. */
  default?: () => unknown
  /** Shown in place of the list when nothing matches. */
  empty?: () => unknown
}>()
</script>

<template>
  <div v-bind="$attrs" class="ev-command" role="dialog" :aria-label="label">
    <div class="ev-command__search">
      <EvInputSearch
        :model-value="modelValue"
        :placeholder="placeholder"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>

    <div
      class="ev-command__sections"
      :style="
        maxHeight
          ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }
          : undefined
      "
    >
      <slot />
      <div v-if="$slots.empty" class="ev-command__empty"><slot name="empty" /></div>
    </div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from `D - Command` on the Command page.
 *
 * Node tree, in board order:
 *   D - Command   VERTICAL, radius 12, a 1px border/tertiary OUTSIDE stroke,
 *                 elevation/md, 500 wide
 *     Search      VERTICAL, gap 10, padding 8, bg/primary, radius 12/12/0/0
 *       InputSearch  one instance
 *     Divider     a 1px border/primary rule
 *     Section     VERTICAL, padding 6/0 - the .Menu Item rows
 *     Divider
 *     Section     the last one, radius 0/0/12/12
 *
 * The stroke is OUTSIDE, so it is a ring rather than a border - a border
 * would eat 2px out of the 500 the board measures.
 *
 * The rule between Sections is drawn by the group's top border here rather
 * than as a node of its own, so a Command with one group has no rule under
 * an empty list, and a v-if on a group cannot leave an orphan.
 */
.ev-command {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-radius: var(--ev-radius-md);
  background-color: var(--ev-bg-primary);
  box-shadow:
    0 0 0 var(--ev-stroke-xs) var(--ev-border-tertiary),
    var(--ev-elevation-md);

  &__search {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: var(--ev-spacing-sm);
    border-radius: var(--ev-radius-md) var(--ev-radius-md) 0 0;
    background-color: var(--ev-bg-primary);
  }

  &__sections {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
    border-radius: 0 0 var(--ev-radius-md) var(--ev-radius-md);
  }

  /* The Divider frame between two Sections, and above the first. */
  &__sections > * {
    border-top: var(--ev-stroke-xs) solid var(--ev-border-primary);
  }

  &__empty {
    padding: var(--ev-spacing-md) var(--ev-spacing-sm);
    background-color: var(--ev-bg-primary);
    color: var(--ev-text-secondary);
    text-align: center;

    @include type.style('body/regular');
  }
}
</style>
