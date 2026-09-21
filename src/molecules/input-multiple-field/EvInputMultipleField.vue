<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import EvTag from '../../atoms/tag/EvTag.vue'
import type { InputOption } from '../../types'

/*
 * Compiled from the Figma `InputMultipleField` set (555:4109), State only.
 *
 *   State=<x>            VERTICAL gap 4  w FILL
 *   +-- Content          HORIZONTAL gap 8  r6  stroke INSIDE 1
 *   |                    empty pad 16/8 (48px) - filled pad 6/8 (52px)
 *   |   +-- icon 16      [Has L Icon]
 *   |   +-- Content      VERTICAL
 *   |   |   +-- .Input   Title 12 (empty) | Placeholder 14 (filled)
 *   |   |   +-- Selection > TagGroup (Outline, Default spacing, Wrap)
 *   |   |       drawn as a wrapping row of outline EvTag: a molecule may not
 *   |   |       import EvTagGroup (same layer), and the group only lays out
 *   |   +-- cancel 16    Active only
 *   |   +-- chevron 16   down, up while open
 *   +-- Slot             [Has Slot]
 *   +-- .ValidationText
 *
 * The board draws NO notched label here - unlike InputDropdown, the Title is
 * the plain `.Input` text inside Content.
 */

defineOptions({
  name: 'EvInputMultipleField',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Values of the chosen tags. */
    modelValue?: (string | number)[]
    /** Lets a value render its label; without a match the value itself shows. */
    options?: InputOption[]
    /** `.Input` Title while nothing is chosen. */
    label?: string
    /** `.Input` Placeholder line above the tags once something is chosen. */
    placeholder?: string
    /** Active state - the slot is open. */
    open?: boolean
    disabled?: boolean
    error?: boolean
    validationText?: string
    clearable?: boolean
    clearLabel?: string
    removeLabel?: string
  }>(),
  {
    modelValue: () => [],
    options: () => [],
    label: undefined,
    placeholder: undefined,
    open: false,
    disabled: false,
    error: false,
    validationText: undefined,
    clearable: true,
    clearLabel: 'Bersihkan',
    removeLabel: 'Hapus',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: (string | number)[]]
  'update:open': [value: boolean]
  clear: []
}>()

defineSlots<{
  /** Figma's `Has L Icon` - the 16px leading icon. */
  iconLeft?: () => unknown
  /** Figma's `Slot`: the options list (EvInputMultipleOptions), below the field. */
  default?: () => unknown
}>()

const uid = useId()
const panelId = `ev-input-multiple-field-panel-${uid}`
const messageId = `ev-input-multiple-field-msg-${uid}`
const content = ref<HTMLElement | null>(null)

const filled = computed(() => props.modelValue.length > 0)
const showClear = computed(() => props.clearable && props.open && filled.value && !props.disabled)
const tags = computed(() =>
  props.modelValue.map((value) => ({
    value,
    label: props.options.find((o) => o.value === value)?.label ?? String(value),
  })),
)

/* Pointer down outside the field and its slot closes it, like a native select. */
const root = ref<HTMLElement | null>(null)
function onOutside(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) setOpen(false)
}
watch(
  () => props.open,
  (open) => {
    if (typeof document === 'undefined') return
    if (open) document.addEventListener('pointerdown', onOutside)
    else document.removeEventListener('pointerdown', onOutside)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('pointerdown', onOutside)
})

function setOpen(next: boolean) {
  if (!props.disabled) emit('update:open', next)
}

function onKeydown(event: KeyboardEvent) {
  if (event.target !== event.currentTarget) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    setOpen(!props.open)
  } else if (event.key === 'ArrowDown' && !props.open) {
    event.preventDefault()
    setOpen(true)
  } else if (event.key === 'Escape' && props.open) {
    setOpen(false)
  }
}

function remove(value: string | number) {
  emit(
    'update:modelValue',
    props.modelValue.filter((v) => v !== value),
  )
}

function clear() {
  emit('update:modelValue', [])
  emit('clear')
}

defineExpose({ focus: () => content.value?.focus() })
</script>

<template>
  <div
    ref="root"
    class="ev-input-multiple-field"
    :class="{
      'ev-input-multiple-field--filled': filled,
      'ev-input-multiple-field--open': open,
      'ev-input-multiple-field--error': error,
      'ev-input-multiple-field--disabled': disabled,
    }"
  >
    <div
      ref="content"
      v-bind="$attrs"
      class="ev-input-multiple-field__content"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="$slots.default ? panelId : undefined"
      :aria-disabled="disabled || undefined"
      :aria-invalid="error || undefined"
      :aria-describedby="validationText ? messageId : undefined"
      @click="setOpen(!open)"
      @keydown="onKeydown"
    >
      <span v-if="$slots.iconLeft" class="ev-input-multiple-field__lead"
        ><slot name="iconLeft"
      /></span>

      <div class="ev-input-multiple-field__body">
        <span v-if="!filled" class="ev-input-multiple-field__title">{{ label }}</span>
        <template v-else>
          <span class="ev-input-multiple-field__placeholder">{{ placeholder }}</span>
          <div class="ev-input-multiple-field__selection">
            <div class="ev-input-multiple-field__tags">
              <EvTag
                v-for="tag in tags"
                :key="tag.value"
                variant="outline"
                :removable="open && !disabled"
                :remove-label="`${removeLabel} ${tag.label}`"
                @click.stop
                @remove="remove(tag.value)"
              >
                {{ tag.label }}
              </EvTag>
            </div>
          </div>
        </template>
      </div>

      <button
        v-if="showClear"
        type="button"
        class="ev-input-multiple-field__icon ev-input-multiple-field__clear"
        :aria-label="clearLabel"
        @click.stop="clear"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>

      <span v-if="!disabled" class="ev-input-multiple-field__icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
          <path v-if="open" d="M6 12l4-4 4 4" stroke-linecap="round" stroke-linejoin="round" />
          <path v-else d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </div>

    <div v-if="$slots.default && open" :id="panelId" class="ev-input-multiple-field__slot">
      <slot />
    </div>

    <p v-if="validationText" :id="messageId" class="ev-input-multiple-field__message">
      {{ validationText }}
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-input-multiple-field {
  --ev-imf-bg: var(--ev-bg-primary);
  --ev-imf-border: var(--ev-border-primary);
  --ev-imf-title: var(--ev-text-secondary);
  --ev-imf-fg: var(--ev-text-primary);
  --ev-imf-icon: var(--ev-icon-primary);
  --ev-imf-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  &__content {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    padding: var(--ev-spacing-lg) var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid var(--ev-imf-border);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-imf-bg);
    cursor: pointer;
    transition: border-color var(--ev-duration-fast) var(--ev-easing-standard);

    &:focus-visible {
      outline: none;
      border-color: var(--ev-brand-primary);
    }
  }

  /* Filled rows carry a 24px tag line, so the board trims the padding to 6. */
  &--filled &__content {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  &--open &__content {
    border-color: var(--ev-brand-primary);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    color: var(--ev-imf-title);

    @include type.style('body/small');
  }

  &__placeholder {
    color: var(--ev-imf-fg);

    @include type.style('body/regular');
  }

  /* TagGroup Type=Wrap, Spacing=Default: gap 4, row-gap 4. */
  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ev-spacing-xs);
  }

  &__lead,
  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-imf-icon);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__clear {
    cursor: pointer;

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: 1px;
      border-radius: var(--ev-radius-rd);
    }
  }

  &__slot {
    display: flex;
    gap: var(--ev-spacing-xs);
  }

  &__message {
    margin: 0;
    color: var(--ev-imf-message);

    @include type.style('body/small');
  }

  &--error {
    --ev-imf-border: var(--ev-ext-error);
    --ev-imf-title: var(--ev-ext-error-bold);
    --ev-imf-message: var(--ev-ext-error);
  }

  &--error &__placeholder {
    color: var(--ev-ext-error-bold);
  }

  &--error#{&}--open &__content {
    border-color: var(--ev-ext-error);
  }

  &--disabled {
    --ev-imf-bg: var(--ev-bg-subtle);
    --ev-imf-border: var(--ev-border-primary);
    --ev-imf-title: var(--ev-text-primary);
  }

  &--disabled &__content {
    cursor: not-allowed;
  }
}
</style>
