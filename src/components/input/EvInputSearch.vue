<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({
  name: 'EvInputSearch',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    modelValue?: string
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    error?: boolean
    validationText?: string
  }>(),
  {
    modelValue: '',
    placeholder: 'Cari sesuatu...',
    disabled: false,
    readonly: false,
    clearable: true,
    error: false,
    validationText: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
  clear: []
}>()

defineSlots<{
  shortcut?: () => unknown
}>()

const inputId = `ev-input-search-${useId()}`
const messageId = `ev-input-search-msg-${useId()}`

const hasValue = computed(() => Boolean(props.modelValue))
const showClear = computed(
  () => props.clearable && hasValue.value && !props.disabled && !props.readonly,
)

function onInput(event: Event) {
  const val = (event.target as HTMLInputElement).value
  emit('update:modelValue', val)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    emit('search', props.modelValue || '')
  }
}

function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div
    class="ev-input-search"
    :class="{
      'ev-input-search--error': error,
      'ev-input-search--disabled': disabled,
    }"
  >
    <div class="ev-input-search__field">
      <!-- Leading Search Icon -->
      <span class="ev-input-search__icon">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="9" cy="9" r="6" />
          <path d="M13.5 13.5L17 17" stroke-linecap="round" />
        </svg>
      </span>

      <input
        :id="inputId"
        v-bind="$attrs"
        class="ev-input-search__control"
        type="search"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :aria-invalid="error || undefined"
        :aria-describedby="validationText ? messageId : undefined"
        @input="onInput"
        @keydown="onKeyDown"
      />

      <button
        v-if="showClear"
        type="button"
        class="ev-input-search__clear"
        aria-label="Bersihkan pencarian"
        @click="clear"
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.4" fill="none" />
          <path d="M7.5 7.5l5 5M12.5 7.5l-5 5" stroke="currentColor" stroke-width="1.4" />
        </svg>
      </button>

      <div v-if="$slots.shortcut" class="ev-input-search__shortcut">
        <slot name="shortcut" />
      </div>
    </div>

    <p v-if="validationText" :id="messageId" class="ev-input-search__message">
      {{ validationText }}
    </p>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-input-search {
  --ev-search-bg: var(--ev-bg-primary);
  --ev-search-border: var(--ev-border-primary);
  --ev-search-fg: var(--ev-text-primary);
  --ev-search-placeholder: var(--ev-text-secondary);
  --ev-search-message: var(--ev-text-secondary);

  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-xs);

  &__field {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    height: 44px;
    padding: var(--ev-spacing-md);
    border: var(--ev-stroke-xs) solid var(--ev-search-border);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-search-bg);
    transition: border-color var(--ev-duration-fast) var(--ev-easing-standard);

    &:focus-within {
      border-color: var(--ev-brand-primary);
    }
  }

  &__control {
    flex: 1;
    min-width: 0;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-search-fg);

    @include type.style('body/small');

    &::placeholder {
      color: var(--ev-search-placeholder);
    }

    &:focus {
      outline: none;
    }

    /* Remove browser default cancel button in search inputs */
    &::-webkit-search-cancel-button {
      display: none;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    color: var(--ev-icon-primary);

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &__clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-primary);
    cursor: pointer;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &__shortcut {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__message {
    margin: 0;
    color: var(--ev-search-message);

    @include type.style('body/small');
  }

  &--error {
    --ev-search-border: var(--ev-ext-error);
    --ev-search-message: var(--ev-ext-error);
    --ev-search-placeholder: var(--ev-ext-error);

    .ev-input-search__field:focus-within {
      border-color: var(--ev-ext-error);
    }
  }

  &--disabled {
    --ev-search-bg: var(--ev-bg-subtle);
    --ev-search-placeholder: var(--ev-text-primary);
    cursor: not-allowed;
  }
}
</style>
