<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { SelectFieldSize } from '../../types'

/*
 * Compiled from the Figma `InputDropdown` set (555:3041), State x Size.
 * A select-style field: a trailing chevron that opens a list of options mounted in the default slot.
 *
 *   ev-input-dropdown
 *   +-- __content   Content: notched Title, [leading icon], value, [clear], glyph
 *   +-- __slot      Slot (only when the default slot is filled and open)
 *   +-- __message   .ValidationText
 *
 * The shared box lives in `styles/_select-field.scss`. `State` is not a prop:
 * Active is the `open` model, Filled is a non-empty `modelValue`, Error and
 * Disabled are their own booleans.
 */

defineOptions({
  name: 'EvInputDropdown',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** The displayed value. Empty shows the placeholder. */
    modelValue?: string
    placeholder?: string
    /** The notched Title. */
    label?: string
    /** Appends the board's red asterisk to the Title. */
    required?: boolean
    /** Figma's `Size`: default (44px) or small (36px). */
    size?: SelectFieldSize
    /** Active state - the slot is open. */
    open?: boolean
    disabled?: boolean
    /** Switches the field to the error style. Pair it with `validationText`. */
    error?: boolean
    /** Figma's `Has Validation Text`. */
    validationText?: string
    /** Shows the clear button while open and holding a value. */
    clearable?: boolean
    clearLabel?: string
  }>(),
  {
    modelValue: '',
    placeholder: undefined,
    label: undefined,
    required: false,
    size: 'default',
    open: false,
    disabled: false,
    error: false,
    validationText: undefined,
    clearable: true,
    clearLabel: 'Bersihkan',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:open': [value: boolean]
  clear: []
}>()

defineSlots<{
  /** Figma's `Has L Icon` - the 16px leading icon. */
  iconLeft?: () => unknown
  /** Figma's `Slot`: the options list (EvDropdownList), drawn below the field. */
  default?: () => unknown
}>()

const uid = useId()
const contentId = `ev-input-dropdown-${uid}`
const panelId = `ev-input-dropdown-panel-${uid}`
const messageId = `ev-input-dropdown-msg-${uid}`
const content = ref<HTMLElement | null>(null)

const hasValue = computed(() => props.modelValue !== '' && props.modelValue != null)
const showClear = computed(() => props.clearable && props.open && hasValue.value && !props.disabled)
const hideGlyph = computed(() => props.disabled)

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

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}

defineExpose({ focus: () => content.value?.focus() })
</script>

<template>
  <div
    ref="root"
    class="ev-input-dropdown"
    :class="{
      'ev-input-dropdown--small': size === 'small',
      'ev-input-dropdown--open': open,
      'ev-input-dropdown--error': error,
      'ev-input-dropdown--disabled': disabled,
    }"
  >
    <div
      :id="contentId"
      ref="content"
      v-bind="$attrs"
      class="ev-input-dropdown__content"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="$slots.default ? panelId : undefined"
      :aria-disabled="disabled || undefined"
      :aria-invalid="error || undefined"
      :aria-describedby="validationText ? messageId : undefined"
      @click="setOpen(!open)"
      @keydown="onKeydown"
    >
      <!-- The board's Label frame is absolute: it breaks the top border. -->
      <span v-if="label" class="ev-input-dropdown__label"
        ><span
          >{{ label
          }}<span v-if="required" class="ev-input-dropdown__required" aria-hidden="true"
            >*</span
          ></span
        ></span
      >

      <span v-if="$slots.iconLeft" class="ev-input-dropdown__lead"><slot name="iconLeft" /></span>
      <span
        class="ev-input-dropdown__value"
        :class="{ 'ev-input-dropdown__value--placeholder': !hasValue }"
        >{{ hasValue ? modelValue : placeholder }}</span
      >

      <button
        v-if="showClear"
        type="button"
        class="ev-input-dropdown__clear"
        :aria-label="clearLabel"
        @click.stop="clear"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>

      <span v-if="!hideGlyph" class="ev-input-dropdown__glyph">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          aria-hidden="true"
          focusable="false"
        >
          <path v-if="open" d="M6 12l4-4 4 4" stroke-linecap="round" stroke-linejoin="round" />
          <path v-else d="M6 8l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </div>

    <div v-if="$slots.default && open" :id="panelId" class="ev-input-dropdown__slot"><slot /></div>

    <p v-if="validationText" :id="messageId" class="ev-input-dropdown__message">
      {{ validationText }}
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/select-field' as sf;

@include sf.select-field('ev-input-dropdown');
</style>
