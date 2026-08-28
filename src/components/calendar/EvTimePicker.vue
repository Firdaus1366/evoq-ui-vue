<script setup lang="ts">
import { computed, ref, watch } from 'vue'

defineOptions({
  name: 'EvTimePicker',
})

export type TimePickerFormat = 'default' | 'with-seconds' | 'am-pm' | 'am-pm-seconds'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    format?: TimePickerFormat
    disabled?: boolean
    readonly?: boolean
    /** Title label above the time picker */
    title?: string
    cancelLabel?: string
    applyLabel?: string
  }>(),
  {
    modelValue: '00:00',
    format: 'default',
    disabled: false,
    readonly: false,
    title: 'Pilih Waktu',
    cancelLabel: 'Batal',
    applyLabel: 'Terapkan',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  apply: [value: string]
  cancel: []
}>()

const is12Hour = computed(() => props.format === 'am-pm' || props.format === 'am-pm-seconds')
const showSeconds = computed(
  () => props.format === 'with-seconds' || props.format === 'am-pm-seconds',
)

const hours = computed(() => {
  if (is12Hour.value) {
    return Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  }
  return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
})

const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const seconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
const periods = ['AM', 'PM']

const selectedHour = ref('00')
const selectedMinute = ref('00')
const selectedSecond = ref('00')
const selectedPeriod = ref<'AM' | 'PM'>('AM')

function parseValue(val: string) {
  if (!val) return
  const parts = val.trim().split(' ')
  const timeParts = parts[0]?.split(':') || []
  if (timeParts[0]) selectedHour.value = timeParts[0].padStart(2, '0')
  if (timeParts[1]) selectedMinute.value = timeParts[1].padStart(2, '0')
  if (timeParts[2]) selectedSecond.value = timeParts[2].padStart(2, '0')
  if (parts[1]) {
    selectedPeriod.value = parts[1].toUpperCase() === 'PM' ? 'PM' : 'AM'
  }
}

watch(
  () => props.modelValue,
  (val) => {
    parseValue(val)
  },
  { immediate: true },
)

function formattedTime() {
  let res = `${selectedHour.value}:${selectedMinute.value}`
  if (showSeconds.value) {
    res += `:${selectedSecond.value}`
  }
  if (is12Hour.value) {
    res += ` ${selectedPeriod.value}`
  }
  return res
}

function selectH(h: string) {
  if (props.disabled || props.readonly) return
  selectedHour.value = h
  emit('update:modelValue', formattedTime())
}

function selectM(m: string) {
  if (props.disabled || props.readonly) return
  selectedMinute.value = m
  emit('update:modelValue', formattedTime())
}

function selectS(s: string) {
  if (props.disabled || props.readonly) return
  selectedSecond.value = s
  emit('update:modelValue', formattedTime())
}

function selectP(p: string) {
  if (props.disabled || props.readonly) return
  selectedPeriod.value = p as 'AM' | 'PM'
  emit('update:modelValue', formattedTime())
}

function onApply() {
  const result = formattedTime()
  emit('update:modelValue', result)
  emit('apply', result)
}

function onCancel() {
  parseValue(props.modelValue)
  emit('cancel')
}
</script>

<template>
  <div class="ev-time-picker" :class="{ 'ev-time-picker--disabled': disabled }">
    <div class="ev-time-picker__header">
      <span class="ev-time-picker__title">{{ title }}</span>
      <span class="ev-time-picker__display">{{ formattedTime() }}</span>
    </div>

    <!-- Time columns selector -->
    <div class="ev-time-picker__body">
      <!-- Hours Column -->
      <div class="ev-time-picker__col">
        <div class="ev-time-picker__col-label">Jam</div>
        <div class="ev-time-picker__list">
          <button
            v-for="h in hours"
            :key="h"
            type="button"
            class="ev-time-picker__item"
            :class="{ 'ev-time-picker__item--active': h === selectedHour }"
            :disabled="disabled || readonly"
            @click="selectH(h)"
          >
            {{ h }}
          </button>
        </div>
      </div>

      <!-- Minutes Column -->
      <div class="ev-time-picker__col">
        <div class="ev-time-picker__col-label">Menit</div>
        <div class="ev-time-picker__list">
          <button
            v-for="m in minutes"
            :key="m"
            type="button"
            class="ev-time-picker__item"
            :class="{ 'ev-time-picker__item--active': m === selectedMinute }"
            :disabled="disabled || readonly"
            @click="selectM(m)"
          >
            {{ m }}
          </button>
        </div>
      </div>

      <!-- Seconds Column (Optional) -->
      <div v-if="showSeconds" class="ev-time-picker__col">
        <div class="ev-time-picker__col-label">Detik</div>
        <div class="ev-time-picker__list">
          <button
            v-for="s in seconds"
            :key="s"
            type="button"
            class="ev-time-picker__item"
            :class="{ 'ev-time-picker__item--active': s === selectedSecond }"
            :disabled="disabled || readonly"
            @click="selectS(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- AM / PM Column (Optional) -->
      <div v-if="is12Hour" class="ev-time-picker__col ev-time-picker__col--period">
        <div class="ev-time-picker__col-label">Periode</div>
        <div class="ev-time-picker__list">
          <button
            v-for="p in periods"
            :key="p"
            type="button"
            class="ev-time-picker__item"
            :class="{ 'ev-time-picker__item--active': p === selectedPeriod }"
            :disabled="disabled || readonly"
            @click="selectP(p)"
          >
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- Actions footer -->
    <div class="ev-time-picker__footer">
      <button
        type="button"
        class="ev-time-picker__btn ev-time-picker__btn--cancel"
        :disabled="disabled"
        @click="onCancel"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        class="ev-time-picker__btn ev-time-picker__btn--apply"
        :disabled="disabled"
        @click="onApply"
      >
        {{ applyLabel }}
      </button>
    </div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-time-picker {
  --ev-tp-bg: var(--ev-bg-primary);
  --ev-tp-border: var(--ev-border-primary);
  --ev-tp-fg: var(--ev-text-primary);
  --ev-tp-header-bg: var(--ev-bg-secondary);

  box-sizing: border-box;
  display: inline-flex;
  flex-direction: column;
  width: 280px;
  border: var(--ev-stroke-xs) solid var(--ev-tp-border);
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-tp-bg);
  box-shadow: var(--ev-shadow-lg);
  overflow: hidden;
  user-select: none;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    background-color: var(--ev-tp-header-bg);
    border-bottom: 1px solid var(--ev-tp-border);
  }

  &__title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--ev-text-secondary);
  }

  &__display {
    font-size: 0.95rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--ev-brand-primary);
  }

  &__body {
    display: flex;
    height: 180px;
    border-bottom: 1px solid var(--ev-tp-border);
  }

  &__col {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--ev-border-secondary);

    &:last-child {
      border-right: none;
    }
  }

  &__col-label {
    padding: 6px 0;
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ev-text-tertiary);
    background-color: var(--ev-bg-subtle);
    border-bottom: 1px solid var(--ev-border-secondary);
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;

    /* Custom thin scrollbar */
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background-color: var(--ev-border-primary);
      border-radius: 4px;
    }
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 28px;
    padding: 4px 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--ev-tp-fg);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--ev-duration-fast),
      color var(--ev-duration-fast);

    &:hover:not(:disabled) {
      background-color: var(--ev-bg-subtle);
    }

    &--active {
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);
      font-weight: 700;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 8px 12px;
    background-color: var(--ev-tp-header-bg);
  }

  &__btn {
    padding: 6px 12px;
    border: none;
    border-radius: var(--ev-radius-xs);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;

    &--cancel {
      background: transparent;
      color: var(--ev-text-secondary);

      &:hover:not(:disabled) {
        background-color: var(--ev-bg-subtle);
        color: var(--ev-text-primary);
      }
    }

    &--apply {
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);

      &:hover:not(:disabled) {
        background-color: var(--ev-brand-primary-bold);
      }
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>
