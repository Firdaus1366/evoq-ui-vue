<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import {
  RICH_EDITOR_GROUPS,
  RICH_EDITOR_ICONS,
  RICH_EDITOR_TITLES,
  type RichEditorTool,
  type RichEditorToolbarType,
} from './rich-editor-toolbar'

/*
 * Compiled 1:1 from the Figma node `Input / InputRichEditor` (COMPONENT_SET,
 * 7 variants). The node tree is three independent siblings under a VERTICAL
 * auto-layout root with gap 4:
 *
 *   State=<x>            VERTICAL  gap 4   w FILL  h HUG
 *   ├── Content          HORIZONTAL pad 8 gap 4  h FIXED 80  r6  stroke INSIDE 1
 *   ├── .RichEditor      HORIZONTAL pad 8/12 gap 8  h FIXED 36  r5  stroke INSIDE 1
 *   └── .ValidationText  HORIZONTAL gap 4  counter CENTER  h HUG
 *
 * The toolbar sits AFTER the content, in its own bordered box - it is not a
 * strip inside the field. There is no notched/floating label on this node.
 */

defineOptions({
  name: 'EvRichEditor',
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
    /**
     * Which `.RichEditor` type to draw: `big` is the 528px, 19-control bar;
     * `small` is the 360px, 13-control one.
     */
    toolbar?: RichEditorToolbarType
    /** Figma's `Has Scroll`: reveals the 2px scrollbar once the body overflows. */
    hasScroll?: boolean
    maxlength?: number
    /** Figma's `Has Validation Text`: the trailing character counter. */
    showCount?: boolean
    /** Figma's `Has Validation Error`: red border, red message. */
    error?: boolean
    /** The leading message. The board only reveals it in the two Error states. */
    validationText?: string
  }>(),
  {
    modelValue: '',
    placeholder: undefined,
    label: undefined,
    required: false,
    disabled: false,
    readonly: false,
    toolbar: 'big',
    hasScroll: false,
    maxlength: 2000,
    showCount: true,
    error: false,
    validationText: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  /** The board draws a control for these three; the host supplies the UI. */
  emoji: []
  image: []
  attach: []
}>()

const bodyId = `ev-rich-editor-body-${useId()}`
const messageId = `ev-rich-editor-msg-${useId()}`
const body = ref<HTMLDivElement | null>(null)
const focused = ref(false)

const inert = computed(() => props.disabled || props.readonly)
const empty = computed(() => !props.modelValue || props.modelValue === '<br>')

/** The `Title` variant wins while empty; otherwise the muted placeholder. */
const emptyLabel = computed(() => props.label ?? props.placeholder ?? '')
const emptyIsTitle = computed(() => props.label !== undefined)

const count = computed(() => {
  // `innerText` is the honest count once rendered, but jsdom does not implement
  // it - fall back to `textContent`, then to parsing the value itself.
  const el = body.value
  const text = el ? (el.innerText ?? el.textContent) : null
  if (typeof text === 'string') return text.replace(/\n$/, '').length

  const tmp = document.createElement('div')
  tmp.innerHTML = props.modelValue || ''
  return tmp.textContent?.length ?? 0
})

const counter = computed(() => {
  const n = (v: number) => v.toLocaleString('id-ID')
  return `${n(count.value)}/${n(props.maxlength)}`
})

const hasMessage = computed(() => Boolean((props.error && props.validationText) || props.showCount))

/** Keep the contenteditable in step when the value changes from outside. */
watch(
  () => props.modelValue,
  (value) => {
    if (body.value && body.value.innerHTML !== value) body.value.innerHTML = value || ''
  },
  { immediate: true },
)

function sync() {
  if (body.value) emit('update:modelValue', body.value.innerHTML)
}

function run(command: string, value?: string) {
  if (inert.value) return
  body.value?.focus()
  // Deprecated, but still the only cross-browser way to drive a
  // contenteditable. jsdom does not implement it, hence the guard.
  if (typeof document.execCommand === 'function') document.execCommand(command, false, value)
  sync()
}

function clearAll() {
  if (inert.value || !body.value) return
  body.value.innerHTML = ''
  sync()
}

const groups = computed(() => RICH_EDITOR_GROUPS[props.toolbar])
const icons = RICH_EDITOR_ICONS
const titles = RICH_EDITOR_TITLES

/** Every control the board draws, mapped onto what it does to the document. */
function invoke(tool: RichEditorTool) {
  switch (tool) {
    case 'textIncrease':
      return run('fontSize', '5')
    case 'textDecrease':
      return run('fontSize', '2')
    case 'colorText':
      return run('foreColor', '#1b84ff')
    case 'borderColor':
      return run('hiliteColor', '#fef3d7')
    case 'bulleted':
      return run('insertUnorderedList')
    case 'numbered':
      return run('insertOrderedList')
    case 'alignLeft':
      return run('justifyLeft')
    case 'alignCenter':
      return run('justifyCenter')
    case 'alignRight':
      return run('justifyRight')
    case 'link':
      return run('createLink', 'https://')
    case 'clear':
      return clearAll()
    // The board draws a control for these three; the host supplies the UI.
    case 'emoji':
      return emit('emoji')
    case 'image':
      return emit('image')
    case 'attach':
      return emit('attach')
    default:
      return run(tool)
  }
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
    class="ev-rich-editor"
    :class="{
      'ev-rich-editor--error': error,
      'ev-rich-editor--disabled': disabled,
      'ev-rich-editor--active': focused && !disabled,
      'ev-rich-editor--scroll': hasScroll,
    }"
  >
    <!-- node: Content — HORIZONTAL, pad 8, gap 4, h 80 FIXED, r6, stroke #c4cada INSIDE 1 -->
    <div class="ev-rich-editor__content">
      <div
        :id="bodyId"
        ref="body"
        class="ev-rich-editor__body"
        :contenteditable="!inert"
        role="textbox"
        aria-multiline="true"
        :aria-invalid="error || undefined"
        :aria-describedby="hasMessage ? messageId : undefined"
        v-bind="$attrs"
        @input="sync"
        @focus="onFocus"
        @blur="onBlur"
      />

      <!-- node: .Input > .InputType — Title (12px) or Placeholder-default (14px) -->
      <span
        v-if="empty && emptyLabel"
        class="ev-rich-editor__empty"
        :class="
          emptyIsTitle ? 'ev-rich-editor__empty--title' : 'ev-rich-editor__empty--placeholder'
        "
        aria-hidden="true"
        >{{ emptyLabel
        }}<span v-if="required && emptyIsTitle" class="ev-rich-editor__required">*</span></span
      >
    </div>

    <!-- node: .RichEditor — HORIZONTAL, pad 8/12, gap 8, h 36 FIXED, r5, stroke #dbdfe9 INSIDE 1 -->
    <div
      v-if="!disabled"
      class="ev-rich-editor__toolbar"
      :class="`ev-rich-editor__toolbar--${toolbar}`"
      role="toolbar"
      aria-label="Alat format teks"
    >
      <template v-for="(group, index) in groups" :key="index">
        <!-- node: Separator > Line 1 — one rule between each pair of groups. -->
        <span v-if="index > 0" class="ev-rich-editor__separator" aria-hidden="true" />

        <button
          v-for="tool in group"
          :key="tool"
          type="button"
          :title="titles[tool]"
          :disabled="inert"
          @click="invoke(tool)"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <component :is="node.tag" v-for="(node, i) in icons[tool]" :key="i" v-bind="node" />
          </svg>
        </button>
      </template>
    </div>

    <!-- node: .ValidationText — HORIZONTAL, gap 4, counter CENTER, h HUG -->
    <p v-if="hasMessage" :id="messageId" class="ev-rich-editor__message">
      <span class="ev-rich-editor__message-start">
        <template v-if="error && validationText">{{ validationText }}</template>
      </span>
      <span v-if="showCount" class="ev-rich-editor__message-end">{{ counter }}</span>
    </p>
  </div>
</template>

<style lang="scss">
/*
 * Values are the literal ones read off the Figma node. Every colour below is
 * also an EVOQ semantic token at the same value - see the note in the PR if
 * this needs to follow `data-ev-theme` / `data-ev-brand`.
 */
.ev-rich-editor {
  /* Content stroke + fill, by state. */
  --ev-rich-editor-border: #c4cada;
  --ev-rich-editor-bg: #ffffff;
  --ev-rich-editor-fg: #071437;
  --ev-rich-editor-message: #78829d;

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

  /* ---------------------------------------------------------- Content */
  &__content {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 4px;
    width: 100%;
    height: 80px;
    padding: 8px;
    border: 1px solid var(--ev-rich-editor-border);
    border-radius: 6px;
    background-color: var(--ev-rich-editor-bg);
  }

  &__body {
    flex: 1 1 0%;
    align-self: stretch;
    min-width: 0;
    overflow-y: hidden;
    outline: none;
    color: var(--ev-rich-editor-fg);
    font-family:
      Inter,
      -apple-system,
      'Segoe UI',
      sans-serif;
    font-size: 14px;
    font-weight: 500;
    line-height: 16px;
    letter-spacing: 0;
  }

  /* Figma's `.InputType` sits on top of the body while the field is empty. */
  &__empty {
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    pointer-events: none;
    font-family:
      Inter,
      -apple-system,
      'Segoe UI',
      sans-serif;
    font-weight: 500;
    letter-spacing: 0;

    /* Variant=Title */
    &--title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      line-height: 16px;
      color: #78829d;
    }

    /* Variant=Placeholder-default */
    &--placeholder {
      font-size: 14px;
      line-height: 16px;
      color: #c4cada;
    }
  }

  &__required {
    color: #f82a5b;
    font-size: 14px;
    line-height: 16px;
  }

  /* --------------------------------------------------------- Toolbar */
  &__toolbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 100%;
    height: 36px;
    padding: 8px 12px;
    border: 1px solid #dbdfe9;
    border-radius: 5px;
    background-color: #ffffff;

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: 0;
      background: none;
      color: #78829d;
      cursor: pointer;

      svg {
        width: 16px;
        height: 16px;
        display: block;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      &:focus-visible {
        outline: 2px solid #1b84ff;
        outline-offset: 2px;
        border-radius: 2px;
      }
    }
  }

  /* node: Separator > Line 1 - a 1px rule, 20px tall. */
  &__separator {
    flex: 0 0 auto;
    width: 1px;
    height: 20px;
    background-color: #99a1b7;
  }

  /* -------------------------------------------------- Validation text */
  &__message {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    width: 100%;
    height: fit-content;
    margin: 0;
    color: var(--ev-rich-editor-message);
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
    --ev-rich-editor-border: #1b84ff;
  }

  &--error {
    --ev-rich-editor-border: #f82a5b;
    --ev-rich-editor-fg: #c62249;
    --ev-rich-editor-message: #f82a5b;

    .ev-rich-editor__empty--title {
      color: #c62249;
    }
  }

  &--disabled {
    --ev-rich-editor-border: #dbdfe9;
    --ev-rich-editor-bg: #ebedf1;

    .ev-rich-editor__empty--title {
      color: #071437;
    }

    .ev-rich-editor__body {
      cursor: not-allowed;
    }
  }

  /* Figma's `Has Scroll`: the 2px bar, 1px #dbdfe9 track over #c4cada thumb. */
  &--scroll &__body {
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
