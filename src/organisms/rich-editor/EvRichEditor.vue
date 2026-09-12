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
@use '../../styles/typography' as type;

/*
 * Traced from the `InputRichEditor` component set in Figma (7 States) and the
 * `.RichEditor` toolbar set.
 *
 * These values were originally written as the literals read off the node, with
 * a note deferring the token mapping. They resolve to exactly the same colours,
 * but through the semantic layer, so the component now follows `data-ev-theme`
 * and all four `data-ev-brand` themes. `verify:figma` resolves the chain back
 * to the board's hexes, which is what proves the mapping changed none of them.
 */
.ev-rich-editor {
  /* Content stroke + fill, by state. */
  --ev-rich-editor-border: var(--ev-border-tertiary);
  --ev-rich-editor-bg: var(--ev-bg-primary);
  --ev-rich-editor-fg: var(--ev-text-primary);
  --ev-rich-editor-message: var(--ev-text-secondary);

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

  /* ---------------------------------------------------------- Content */
  &__content {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    gap: var(--ev-spacing-xs);
    width: 100%;
    height: 80px;
    padding: var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid var(--ev-rich-editor-border);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-rich-editor-bg);
  }

  &__body {
    flex: 1 1 0%;
    align-self: stretch;
    min-width: 0;
    overflow-y: hidden;
    outline: none;
    color: var(--ev-rich-editor-fg);
    letter-spacing: var(--ev-letter-spacing-normal);

    @include type.style('body/regular');
  }

  /* Figma's `.InputType` sits on top of the body while the field is empty. */
  &__empty {
    position: absolute;
    top: var(--ev-spacing-sm);
    left: var(--ev-spacing-sm);
    right: var(--ev-spacing-sm);
    pointer-events: none;
    font-family: var(--ev-font-family-base);
    font-weight: var(--ev-font-weight-medium);
    letter-spacing: var(--ev-letter-spacing-normal);

    /* Variant=Title */
    &--title {
      display: inline-flex;
      align-items: center;
      /* Off the spacing scale (8 then 12) - the board draws 10. */
      gap: 10px;
      font-size: var(--ev-font-size-xs);
      line-height: var(--ev-line-height-xs);
      color: var(--ev-text-secondary);
    }

    /* Variant=Placeholder-default */
    &--placeholder {
      font-size: var(--ev-font-size-sm);
      line-height: var(--ev-line-height-xs);
      color: var(--ev-text-tertiary);
    }
  }

  &__required {
    color: var(--ev-ext-error);
    font-size: var(--ev-font-size-sm);
    line-height: var(--ev-line-height-xs);
  }

  /* --------------------------------------------------------- Toolbar */
  &__toolbar {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ev-spacing-sm);
    width: 100%;
    height: 36px;
    padding: var(--ev-spacing-sm) var(--ev-spacing-md);
    border: var(--ev-stroke-xs) solid var(--ev-border-primary);
    /* Off the radius scale (4 then 6) - the board draws 5 on the toolbar. */
    border-radius: 5px;
    background-color: var(--ev-bg-primary);

    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      padding: 0;
      border: 0;
      background: none;
      color: var(--ev-icon-primary);
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
        outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
        outline-offset: var(--ev-focus-ring-offset);
        border-radius: var(--ev-radius-2xs);
      }
    }
  }

  /*
   * node: Separator > Line 1 - a 1px rule, 20px tall. Darker than the
   * EvSeparator atom’s border/primary: the board overrides this instance to
   * #99a1b7. Read as icon/secondary rather than border/inverse - the two share
   * that hex in light mode, but border/inverse goes near-white in dark, where
   * this rule has to stay a mid grey between the icon buttons.
   */
  &__separator {
    flex: 0 0 auto;
    width: var(--ev-stroke-xs);
    height: 20px;
    background-color: var(--ev-icon-secondary);
  }

  /* -------------------------------------------------- Validation text */
  &__message {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: var(--ev-spacing-xs);
    width: 100%;
    height: fit-content;
    margin: 0;
    color: var(--ev-rich-editor-message);
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
    --ev-rich-editor-border: var(--ev-brand-primary);
  }

  &--error {
    --ev-rich-editor-border: var(--ev-ext-error);
    --ev-rich-editor-fg: var(--ev-text-error);
    --ev-rich-editor-message: var(--ev-ext-error);

    .ev-rich-editor__empty--title {
      color: var(--ev-text-error);
    }
  }

  &--disabled {
    --ev-rich-editor-border: var(--ev-border-primary);
    --ev-rich-editor-bg: var(--ev-bg-subtle);

    .ev-rich-editor__empty--title {
      color: var(--ev-text-primary);
    }

    .ev-rich-editor__body {
      cursor: not-allowed;
    }
  }

  /*
   * Figma's `Has Scroll`: the 2px bar - a border/primary track under a
   * border/tertiary thumb, the pair EvScrollArea draws too.
   */
  &--scroll &__body {
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
