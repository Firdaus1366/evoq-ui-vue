<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import EvToggle from '../../atoms/toggle/EvToggle.vue'
import EvToggleGroup from '../../molecules/toggle-group/EvToggleGroup.vue'
import EvTimePicker from '../time-picker/EvTimePicker.vue'
import { to12Hour, to24Hour } from './hourFormat'
import type { SelectFieldSize, TimePickerFormat } from '../../types'

/*
 * Compiled from the Figma `InputTime` set (555:2975), State x Size.
 *
 *   ev-input-time
 *   +-- __content   Content: notched Title, value, [clear], clock glyph 20
 *   +-- __slot      Slot - here it holds the panel below
 *   |   +-- __switch   24 jam / 12 jam
 *   |   +-- EvTimePicker with its own Apply / Cancel
 *   +-- __message   .ValidationText
 *
 * An organism, not an atom: the board's Slot node is where a time picker goes,
 * and this component mounts EvTimePicker there itself. Pass the default slot to
 * put something else in the panel. The shared box lives in
 * `styles/_select-field.scss`.
 *
 * The wheel edits a draft; Apply commits it and closes, Cancel throws it away.
 * The 24 / 12 hour switch converts the draft and the committed value alike, so
 * `14:30` and `02:30 PM` stay the same time.
 */

defineOptions({
  name: 'EvInputTime',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** `14:30` in 24-hour, `02:30 PM` in 12-hour; seconds when the format has them. */
    modelValue?: string
    /** The wheel's columns. Follows the 24 / 12 hour switch. */
    format?: TimePickerFormat
    /** Shows the 24 jam / 12 jam switch above the wheel. */
    hourSwitch?: boolean
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
    /** Figma's `Has R Icon`: the trailing clock glyph. On by default. */
    hasRightIcon?: boolean
    cancelLabel?: string
    applyLabel?: string
    hour24Label?: string
    hour12Label?: string
  }>(),
  {
    modelValue: '',
    format: 'default',
    hourSwitch: true,
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
    cancelLabel: 'Cancel',
    applyLabel: 'Apply',
    hour24Label: '24 jam',
    hour12Label: '12 jam',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:format': [value: TimePickerFormat]
  'update:open': [value: boolean]
  clear: []
}>()

defineSlots<{
  /** Replaces the default glyph (Figma's `R Icon` instance swap). */
  iconRight?: () => unknown
  /** Figma's `Slot`: replaces the built-in time picker panel. */
  default?: () => unknown
}>()

const uid = useId()
const contentId = `ev-input-time-${uid}`
const panelId = `ev-input-time-panel-${uid}`
const messageId = `ev-input-time-msg-${uid}`
const content = ref<HTMLElement | null>(null)

/** The format is the host's when it binds `format`, and the switch's otherwise. */
const internalFormat = ref<TimePickerFormat>(props.format)
watch(
  () => props.format,
  (next) => (internalFormat.value = next),
)
const is12Hour = computed(
  () => internalFormat.value === 'am-pm' || internalFormat.value === 'am-pm-seconds',
)

/** The wheel edits this copy; Apply commits it, Cancel drops it. */
const draft = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) draft.value = props.modelValue || '00:00'
    if (typeof document === 'undefined') return
    if (open) document.addEventListener('pointerdown', onOutside)
    else document.removeEventListener('pointerdown', onOutside)
  },
  { immediate: true },
)

const hasValue = computed(() => props.modelValue !== '' && props.modelValue != null)
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

function setHours(twelve: boolean) {
  if (twelve === is12Hour.value) return
  const seconds =
    internalFormat.value === 'with-seconds' || internalFormat.value === 'am-pm-seconds'
  const next: TimePickerFormat = twelve
    ? seconds
      ? 'am-pm-seconds'
      : 'am-pm'
    : seconds
      ? 'with-seconds'
      : 'default'
  const convert = twelve ? to12Hour : to24Hour
  internalFormat.value = next
  draft.value = convert(draft.value)
  // The committed value follows, so the field never shows a stale notation.
  if (hasValue.value) emit('update:modelValue', convert(props.modelValue))
  emit('update:format', next)
}

function apply(value: string) {
  emit('update:modelValue', value)
  setOpen(false)
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
    class="ev-input-time"
    :class="{
      'ev-input-time--small': size === 'small',
      'ev-input-time--open': open,
      'ev-input-time--error': error,
      'ev-input-time--disabled': disabled,
    }"
  >
    <div
      :id="contentId"
      ref="content"
      v-bind="$attrs"
      class="ev-input-time__content"
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
      <span v-if="label" class="ev-input-time__label"
        ><span
          >{{ label
          }}<span v-if="required" class="ev-input-time__required" aria-hidden="true">*</span></span
        ></span
      >

      <span
        class="ev-input-time__value"
        :class="{ 'ev-input-time__value--placeholder': !hasValue }"
        >{{ hasValue ? modelValue : placeholder }}</span
      >

      <button
        v-if="showClear"
        type="button"
        class="ev-input-time__clear"
        :aria-label="clearLabel"
        @click.stop="clear"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>

      <span v-if="hasRightIcon" class="ev-input-time__glyph"
        ><slot name="iconRight"
          ><svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            aria-hidden="true"
            focusable="false"
          >
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 5.5V10l3 2" stroke-linecap="round" stroke-linejoin="round" /></svg
        ></slot>
      </span>
    </div>

    <div v-if="open" :id="panelId" class="ev-input-time__slot">
      <slot>
        <div class="ev-input-time__panel">
          <EvToggleGroup v-if="hourSwitch" size="small" label="Format jam">
            <EvToggle
              class="ev-input-time__switch"
              :model-value="!is12Hour"
              @update:model-value="setHours(false)"
            >
              {{ hour24Label }}
            </EvToggle>
            <EvToggle
              class="ev-input-time__switch"
              :model-value="is12Hour"
              @update:model-value="setHours(true)"
            >
              {{ hour12Label }}
            </EvToggle>
          </EvToggleGroup>

          <EvTimePicker
            v-model="draft"
            :format="internalFormat"
            :cancel-label="cancelLabel"
            :apply-label="applyLabel"
            @apply="apply"
            @cancel="setOpen(false)"
          />
        </div>
      </slot>
    </div>

    <p v-if="validationText" :id="messageId" class="ev-input-time__message">{{ validationText }}</p>
  </div>
</template>

<style lang="scss">
@use '../../styles/select-field' as sf;

@include sf.select-field('ev-input-time');

.ev-input-time__panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ev-spacing-sm);
}
</style>
