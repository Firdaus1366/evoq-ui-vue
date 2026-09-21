<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import EvCalendar from '../calendar/EvCalendar.vue'
import type { CalendarMode, SelectFieldSize } from '../../types'

/*
 * Compiled from the Figma `InputDate` set (543:2651), State x Size.
 *
 *   ev-input-date
 *   +-- __content   Content: notched Title, value, [clear], calendar glyph 20
 *   +-- __slot      Slot - here it holds EvCalendar, with its Cancel / Select date footer
 *   +-- __message   .ValidationText
 *
 * An organism, not an atom: the board's Slot node is where a date picker goes,
 * and this component mounts EvCalendar there itself. Pass the default slot to
 * put something else in the panel. The shared box lives in
 * `styles/_select-field.scss`.
 *
 * The value is a real `Date` (or a `[from, to]` pair in range mode), not text.
 * Single or range is the `mode` prop and nothing else - there is no switch in
 * the panel, so a form decides it in code.
 *
 * Picking in the calendar only edits a draft: Select date commits it and
 * closes, Cancel throws it away.
 */

defineOptions({
  name: 'EvInputDate',
  inheritAttrs: false,
})

type DateValue = Date | [Date | null, Date | null] | null

const props = withDefaults(
  defineProps<{
    /** A single date, or a `[from, to]` pair in range mode. */
    modelValue?: DateValue
    /** `single` for one date, `range` for a `[from, to]` pair. Set in code. */
    mode?: CalendarMode
    placeholder?: string
    /** The notched Title. */
    label?: string
    /** Appends the board's red asterisk to the Title. */
    required?: boolean
    /** Figma's `Size`: default (44px) or small (36px). */
    size?: SelectFieldSize
    /** Active state - the panel is open. */
    open?: boolean
    disabled?: boolean
    /** Switches the field to the error style. Pair it with `validationText`. */
    error?: boolean
    /** Figma's `Has Validation Text`. */
    validationText?: string
    /** Shows the clear button while open and holding a value. */
    clearable?: boolean
    clearLabel?: string
    /** Figma's `Has R Icon`: the trailing calendar glyph. On by default. */
    hasRightIcon?: boolean
    /** Locale for the displayed value and the calendar. */
    locale?: string
    min?: Date
    max?: Date
    cancelLabel?: string
    applyLabel?: string
  }>(),
  {
    modelValue: null,
    mode: 'single',
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
    hasRightIcon: true,
    locale: 'id-ID',
    min: undefined,
    max: undefined,
    cancelLabel: 'Cancel',
    applyLabel: 'Select date',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DateValue]
  'update:open': [value: boolean]
  clear: []
}>()

defineSlots<{
  /** Replaces the default glyph (Figma's `R Icon` instance swap). */
  iconRight?: () => unknown
  /** Figma's `Slot`: replaces the built-in calendar panel. */
  default?: () => unknown
}>()

const uid = useId()
const contentId = `ev-input-date-${uid}`
const panelId = `ev-input-date-panel-${uid}`
const messageId = `ev-input-date-msg-${uid}`
const content = ref<HTMLElement | null>(null)

/** Picking edits this copy; Select date commits it, Cancel drops it. */
const draft = ref<DateValue>(clone(props.modelValue))

function clone(value: DateValue): DateValue {
  if (Array.isArray(value)) return [value[0], value[1]]
  return value ?? null
}

watch(
  () => props.open,
  (open) => {
    if (open) draft.value = clone(props.modelValue)
    if (typeof document === 'undefined') return
    if (open) document.addEventListener('pointerdown', onOutside)
    else document.removeEventListener('pointerdown', onOutside)
  },
  { immediate: true },
)

/** A draft from one mode means nothing in the other. */
watch(
  () => props.mode,
  () => (draft.value = null),
)

const format = computed(
  () => new Intl.DateTimeFormat(props.locale, { day: '2-digit', month: 'short', year: 'numeric' }),
)

const text = computed(() => {
  const value = props.modelValue
  if (value instanceof Date) return format.value.format(value)
  if (Array.isArray(value) && value[0]) {
    const from = format.value.format(value[0])
    return value[1] ? `${from} – ${format.value.format(value[1])}` : from
  }
  return ''
})

const hasValue = computed(() => text.value !== '')
const showClear = computed(() => props.clearable && props.open && hasValue.value && !props.disabled)

/* Pointer down outside the field and its panel closes it, like a native select. */
const root = ref<HTMLElement | null>(null)
function onOutside(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) setOpen(false)
}
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

function apply() {
  const value = draft.value
  const complete = Array.isArray(value) ? Boolean(value[0] && value[1]) : Boolean(value)
  // A range needs both ends; an empty pick has nothing to commit.
  if (!complete) return
  emit('update:modelValue', clone(value))
  setOpen(false)
}

function clear() {
  draft.value = null
  emit('update:modelValue', null)
  emit('clear')
}

defineExpose({ focus: () => content.value?.focus() })
</script>

<template>
  <div
    ref="root"
    class="ev-input-date"
    :class="{
      'ev-input-date--small': size === 'small',
      'ev-input-date--open': open,
      'ev-input-date--error': error,
      'ev-input-date--disabled': disabled,
    }"
  >
    <div
      :id="contentId"
      ref="content"
      v-bind="$attrs"
      class="ev-input-date__content"
      role="combobox"
      :tabindex="disabled ? -1 : 0"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="open ? panelId : undefined"
      :aria-disabled="disabled || undefined"
      :aria-invalid="error || undefined"
      :aria-describedby="validationText ? messageId : undefined"
      @click="setOpen(!open)"
      @keydown="onKeydown"
    >
      <!-- The board's Label frame is absolute: it breaks the top border. -->
      <span v-if="label" class="ev-input-date__label"
        ><span
          >{{ label
          }}<span v-if="required" class="ev-input-date__required" aria-hidden="true">*</span></span
        ></span
      >

      <span
        class="ev-input-date__value"
        :class="{ 'ev-input-date__value--placeholder': !hasValue }"
        >{{ hasValue ? text : placeholder }}</span
      >

      <button
        v-if="showClear"
        type="button"
        class="ev-input-date__clear"
        :aria-label="clearLabel"
        @click.stop="clear"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>

      <span v-if="hasRightIcon" class="ev-input-date__glyph"
        ><slot name="iconRight"
          ><svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            aria-hidden="true"
            focusable="false"
          >
            <rect x="3" y="4" width="14" height="13" rx="2.5" />
            <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke-linecap="round" /></svg
        ></slot>
      </span>
    </div>

    <div v-if="open" :id="panelId" class="ev-input-date__slot">
      <slot>
        <EvCalendar
          v-model="draft"
          :mode="mode"
          :locale="locale"
          :min="min"
          :max="max"
          footer
          :cancel-label="cancelLabel"
          :apply-label="applyLabel"
          @apply="apply"
          @cancel="setOpen(false)"
        />
      </slot>
    </div>

    <p v-if="validationText" :id="messageId" class="ev-input-date__message">{{ validationText }}</p>
  </div>
</template>

<style lang="scss">
@use '../../styles/select-field' as sf;

@include sf.select-field('ev-input-date');
</style>
