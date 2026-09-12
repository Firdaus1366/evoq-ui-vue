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
@use '../../styles/typography' as type;

/*
 * Traced from the `InputTextArea` component set in Figma (7 States).
 *
 * Content stroke is `border/tertiary` here - a step darker than `InputField`'s
 * `border/primary`, which is what the board draws.
 *
 * These values were originally written as the literals read off the node. They
 * resolve to exactly the same colours, but through the semantic layer, so the
 * component now follows `data-ev-theme` and all four `data-ev-brand` themes
 * like every other one. `verify:figma` resolves the chain back to the board's
 * hexes, which is what proves the mapping did not change any of them.
 */
.ev-textarea {
  --ev-textarea-border: var(--ev-border-tertiary);
  --ev-textarea-bg: var(--ev-bg-primary);
  --ev-textarea-fg: var(--ev-text-primary);
  --ev-textarea-message: var(--ev-text-secondary);
  --ev-textarea-title: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--ev-spacing-xs);
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
    gap: var(--ev-spacing-xs);
    width: 100%;
    padding: var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid var(--ev-textarea-border);
    border-radius: var(--ev-radius-xs);
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
    letter-spacing: var(--ev-letter-spacing-normal);

    @include type.style('body/regular');

    /* `.InputType` variant `Placeholder-default`. */
    &::placeholder {
      color: var(--ev-text-tertiary);
      opacity: 1;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  /* `.InputType` variant `Title` - overlays the control while empty. */
  &__empty {
    position: absolute;
    top: var(--ev-spacing-sm);
    left: var(--ev-spacing-sm);
    right: var(--ev-spacing-sm);
    display: inline-flex;
    align-items: center;
    /* Off the spacing scale (8 then 12) - the board draws 10, as on Direction. */
    gap: 10px;
    pointer-events: none;
    color: var(--ev-textarea-title);
    letter-spacing: var(--ev-letter-spacing-normal);

    @include type.style('body/small');
  }

  &__required {
    color: var(--ev-ext-error);
    font-size: var(--ev-font-size-sm);
    line-height: var(--ev-line-height-xs);
  }

  /* node: fiber_manual_record - 16x16, icon/primary */
  &__icon {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--ev-icon-primary);

    svg {
      width: 16px;
      height: 16px;
      display: block;
    }
  }

  /*
   * node: cancel - 16x16, #333f47. Off-system: that hex is in no EVOQ ramp and
   * no library ramp, so it stays a literal (the same glyph colour the Command
   * board and Pagination's captions use).
   */
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
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
      border-radius: var(--ev-radius-2xs);
    }
  }

  /* node: .ValidationText - 12px Medium, counter right-aligned */
  &__message {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ev-spacing-xs);
    width: 100%;
    height: fit-content;
    margin: 0;
    color: var(--ev-textarea-message);
    letter-spacing: var(--ev-letter-spacing-normal);

    @include type.style('body/small');
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
    --ev-textarea-border: var(--ev-brand-primary);
  }

  &--error {
    --ev-textarea-border: var(--ev-ext-error);
    --ev-textarea-fg: var(--ev-text-error);
    --ev-textarea-message: var(--ev-ext-error);
    --ev-textarea-title: var(--ev-text-error);
  }

  &--disabled {
    --ev-textarea-border: var(--ev-border-primary);
    --ev-textarea-bg: var(--ev-bg-subtle);
    --ev-textarea-title: var(--ev-text-primary);
  }

  /*
   * Figma's `Has Scroll`: the 2px bar - a border/primary track under a
   * border/tertiary thumb, which is the pair EvScrollArea draws too.
   */
  &--scroll &__control {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ev-border-tertiary) transparent;

    &::-webkit-scrollbar {
      width: 2px;
    }

    &::-webkit-scrollbar-track {
      background-color: var(--ev-border-primary);
      border-radius: var(--ev-radius-sm);
    }

    &::-webkit-scrollbar-thumb {
      background-color: var(--ev-border-tertiary);
      border-radius: var(--ev-radius-sm);
    }
  }
}
</style>
