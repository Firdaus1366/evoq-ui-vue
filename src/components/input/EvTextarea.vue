<script setup lang="ts">
import { computed, ref, useId } from 'vue'

/*
 * Compiled 1:1 from the Figma node `Input / InputTextArea` (COMPONENT_SET,
 * 7 `State` variants). The tree is:
 *
 *   State=<x>            VERTICAL  gap 4  pad 0   w FILL  h HUG
 *   ├── Content          HORIZONTAL pad 8 gap 4   h FIXED 80  r6
 *   │                    counter MIN · stroke INSIDE 1
 *   │   ├── fiber_manual_record  16x16   [Has L Icon]
 *   │   ├── .Input > .InputType  Title 12px | Placeholder-* 14px
 *   │   ├── cancel               16x16   [clear]
 *   │   ├── fiber_manual_record  16x16   [Has R Icon]
 *   │   └── Scroll               2x48    [Has Scroll]
 *   └── .ValidationText  HORIZONTAL gap 4  [Has Validation Text]
 *
 * The board draws NO notched label on this node - the 12px text is the
 * `.InputType` variant `Title`, sitting inside Content. `rows` maps onto the
 * fixed height: 4 rows x 16px line + 16px padding = the board's 80px.
 */

defineOptions({
  name: 'EvTextarea',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string
    /** `.InputType` variant `Placeholder-default` - 14px, shown while empty. */
    placeholder?: string
    /** `.InputType` variant `Title` - 12px, shown while empty instead of the placeholder. */
    label?: string
    /** The `Mandatory` boolean on `.InputType`: appends the red asterisk. */
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    error?: boolean
    /** Drives the fixed height: `rows` x 16px line-height + 16px padding. */
    rows?: number
    maxlength?: number
    /** Figma's `Has Validation Text`: the trailing character counter. */
    showCount?: boolean
    /** The leading message. The board only reveals it in the two Error states. */
    validationText?: string
    /** Trailing helper text. `showCount` wins when both are set. */
    validationTextEnd?: string
    clearable?: boolean
    clearLabel?: string
    /** Figma's `Has Scroll`: reveals the 2px scrollbar once the body overflows. */
    hasScroll?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: undefined,
    label: undefined,
    required: false,
    disabled: false,
    readonly: false,
    error: false,
    rows: 4,
    maxlength: undefined,
    showCount: false,
    validationText: undefined,
    validationTextEnd: undefined,
    clearable: false,
    clearLabel: 'Bersihkan',
    hasScroll: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
}>()

const controlId = `ev-textarea-${useId()}`
const messageId = `ev-textarea-msg-${useId()}`
const focused = ref(false)

const inert = computed(() => props.disabled || props.readonly)
const empty = computed(() => !String(props.modelValue ?? '').length)

/** The `Title` variant wins while empty; otherwise the muted placeholder. */
const emptyIsTitle = computed(() => props.label !== undefined)
const showEmpty = computed(() => empty.value && emptyIsTitle.value)

/** Only the `Placeholder-default` variant maps onto the native attribute. */
const nativePlaceholder = computed(() => (emptyIsTitle.value ? undefined : props.placeholder))

const counter = computed(() => {
  if (!props.showCount) return props.validationTextEnd
  const n = (v: number) => v.toLocaleString('id-ID')
  const used = String(props.modelValue ?? '').length
  return props.maxlength === undefined ? n(used) : `${n(used)}/${n(props.maxlength)}`
})

const showClear = computed(
  () => props.clearable && !inert.value && String(props.modelValue ?? '').length > 0,
)

const hasMessage = computed(() =>
  Boolean((props.error && props.validationText) || counter.value !== undefined),
)

/** The board's fixed 80px is 4 rows of 16px plus the 8px padding either side. */
const height = computed(() => `${props.rows * 16 + 16}px`)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}

function onFocus(event: FocusEvent) {
  focused.value = true
  emit('focus', event)
}

function onBlur(event: FocusEvent) {
  focused.value = false
  emit('blur', event)
}
</script>

<template>
  <div
    class="ev-textarea"
    :class="{
      'ev-textarea--error': error,
      'ev-textarea--disabled': disabled,
      'ev-textarea--active': focused && !disabled,
      'ev-textarea--scroll': hasScroll,
    }"
  >
    <!-- node: Content — HORIZONTAL, pad 8, gap 4, h 80 FIXED, r6, stroke INSIDE 1 -->
    <div class="ev-textarea__content" :style="{ height }">
      <!-- node: fiber_manual_record (Has L Icon) -->
      <span v-if="$slots.iconLeft" class="ev-textarea__icon"><slot name="iconLeft" /></span>

      <!-- node: .Input > .InputType -->
      <textarea
        :id="controlId"
        v-bind="$attrs"
        class="ev-textarea__control"
        :value="modelValue"
        :rows="rows"
        :placeholder="nativePlaceholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :maxlength="maxlength"
        :aria-label="label"
        :aria-invalid="error || undefined"
        :aria-describedby="hasMessage ? messageId : undefined"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
      />

      <span v-if="showEmpty" class="ev-textarea__empty" aria-hidden="true"
        >{{ label }}<span v-if="required" class="ev-textarea__required">*</span></span
      >

      <!-- node: cancel — the clear control -->
      <button
        v-if="showClear"
        type="button"
        class="ev-textarea__clear"
        :aria-label="clearLabel"
        @click="clear"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M8 1.4A6.6 6.6 0 1 0 8 14.6 6.6 6.6 0 0 0 8 1.4Zm2.5 8.1-1 1L8 9l-1.5 1.5-1-1L6.9 8 5.5 6.5l1-1L8 7l1.5-1.5 1 1L9.1 8Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <!-- node: fiber_manual_record (Has R Icon) -->
      <span v-if="$slots.iconRight" class="ev-textarea__icon"><slot name="iconRight" /></span>
    </div>

    <!-- node: .ValidationText — HORIZONTAL, gap 4 -->
    <p v-if="hasMessage" :id="messageId" class="ev-textarea__message">
      <span class="ev-textarea__message-start">
        <template v-if="error && validationText">{{ validationText }}</template>
      </span>
      <span v-if="counter !== undefined" class="ev-textarea__message-end">{{ counter }}</span>
    </p>
  </div>
</template>

<style lang="scss">
/*
 * Literal values read off the Figma node. Content stroke is `#c4cada` here -
 * a step darker than `InputField`'s `#dbdfe9`, which is what the board draws.
 */
.ev-textarea {
  --ev-textarea-border: #c4cada;
  --ev-textarea-bg: #ffffff;
  --ev-textarea-fg: #071437;
  --ev-textarea-message: #78829d;
  --ev-textarea-title: #78829d;

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 4px;
  width: 100%;
  height: fit-content;

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  &__content {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    width: 100%;
    padding: 8px;
    border: 1px solid var(--ev-textarea-border);
    border-radius: 6px;
    background-color: var(--ev-textarea-bg);
  }

  &__control {
    flex: 1 1 0%;
    align-self: stretch;
    min-width: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: none;
    resize: none;
    overflow-y: hidden;
    color: var(--ev-textarea-fg);
    font-family:
      Inter,
      -apple-system,
      'Segoe UI',
      sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0;

    /* `.InputType` variant `Placeholder-default`. */
    &::placeholder {
      color: #c4cada;
      opacity: 1;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  /* `.InputType` variant `Title` - overlays the control while empty. */
  &__empty {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    pointer-events: none;
    color: var(--ev-textarea-title);
    font-family:
      Inter,
      -apple-system,
      'Segoe UI',
      sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0;
  }

  &__required {
    color: #f82a5b;
    font-size: 14px;
    line-height: 16px;
  }

  /* node: fiber_manual_record — 16x16, #78829d */
  &__icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: #78829d;

    svg {
      width: 16px;
      height: 16px;
      display: block;
    }
  }

  /* node: cancel — 16x16, #333f47 */
  &__clear {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: none;
    color: #333f47;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
      display: block;
    }

    &:focus-visible {
      outline: 2px solid #1b84ff;
      outline-offset: 2px;
      border-radius: 2px;
    }
  }

  /* node: .ValidationText — 12px Medium, counter right-aligned */
  &__message {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    width: 100%;
    height: fit-content;
    margin: 0;
    color: var(--ev-textarea-message);
    font-family:
      Inter,
      -apple-system,
      'Segoe UI',
      sans-serif;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0;
  }

  &__message-start {
    flex: 1 1 0%;
    text-align: left;
  }

  &__message-end {
    flex: 0 0 auto;
    text-align: right;
  }

  /* ----------------------------------------------------------- States */
  &--active {
    --ev-textarea-border: #1b84ff;
  }

  &--error {
    --ev-textarea-border: #f82a5b;
    --ev-textarea-fg: #c62249;
    --ev-textarea-message: #f82a5b;
    --ev-textarea-title: #c62249;
  }

  &--disabled {
    --ev-textarea-border: #dbdfe9;
    --ev-textarea-bg: #ebedf1;
    --ev-textarea-title: #071437;
  }

  /* Figma's `Has Scroll`: the 2px bar, #dbdfe9 track under a #c4cada thumb. */
  &--scroll &__control {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #c4cada transparent;

    &::-webkit-scrollbar {
      width: 2px;
    }

    &::-webkit-scrollbar-track {
      background-color: #dbdfe9;
      border-radius: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #c4cada;
      border-radius: 8px;
    }
  }
}
</style>
