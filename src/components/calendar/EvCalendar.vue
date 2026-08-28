<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CalendarMode } from '../../types'

defineOptions({
  name: 'EvCalendar',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** A single date, or a `[from, to]` pair in range mode. */
    modelValue?: Date | [Date | null, Date | null] | null
    mode?: CalendarMode
    /** The month on view. Uncontrolled unless you pass it. */
    month?: Date
    min?: Date
    max?: Date
    /** 0 = Sunday, 1 = Monday. */
    weekStartsOn?: 0 | 1
    /** Locale for the month name and weekday initials. */
    locale?: string
    /** Dates to mark with the board's event dot. */
    events?: Date[]
    /** Whether to show quick date range presets toolbar */
    presets?: boolean
    previousLabel?: string
    nextLabel?: string
  }>(),
  {
    modelValue: null,
    mode: 'single',
    month: undefined,
    min: undefined,
    max: undefined,
    weekStartsOn: 1,
    locale: 'id-ID',
    events: () => [],
    presets: false,
    previousLabel: 'Bulan sebelumnya',
    nextLabel: 'Bulan berikutnya',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Date | [Date | null, Date | null] | null]
  'update:month': [value: Date]
}>()

/** Midnight, so every comparison is date-only and time never leaks in. */
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date | null, b: Date | null) =>
  Boolean(a && b && startOfDay(a).getTime() === startOfDay(b).getTime())

const internalMonth = ref(startOfDay(props.month ?? new Date()))
watch(
  () => props.month,
  (next) => {
    if (next) internalMonth.value = startOfDay(next)
  },
)

const viewMonth = computed(() => props.month ?? internalMonth.value)

const range = computed<[Date | null, Date | null]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [null, null],
)
const single = computed(() => (props.modelValue instanceof Date ? props.modelValue : null))

const monthLabel = computed(() =>
  new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }).format(viewMonth.value),
)

const weekdays = computed(() => {
  const fmt = new Intl.DateTimeFormat(props.locale, { weekday: 'short' })
  // 2024-01-07 was a Sunday, which makes the offset arithmetic obvious.
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(2024, 0, 7 + ((i + props.weekStartsOn) % 7))),
  )
})

/**
 * Six full weeks, so the grid never changes height as months change - which
 * is what the board draws, and what stops a popover jumping when you page.
 */
const days = computed(() => {
  const first = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth(), 1)
  const lead = (first.getDay() - props.weekStartsOn + 7) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date, outside: date.getMonth() !== viewMonth.value.getMonth() }
  })
})

const isDisabled = (d: Date) =>
  Boolean((props.min && d < startOfDay(props.min)) || (props.max && d > startOfDay(props.max)))

const hasEvent = (d: Date) => props.events.some((e) => sameDay(e, d))

/** Which of the board's eight DayCell states this date is in. */
function stateOf(date: Date, outside: boolean) {
  if (isDisabled(date)) return 'disabled'

  if (props.mode === 'range') {
    const [from, to] = range.value
    if (sameDay(date, from) && sameDay(date, to)) return 'selected'
    if (sameDay(date, from)) return 'l-select'
    if (sameDay(date, to)) return 'r-select'
    if (from && to && date > startOfDay(from) && date < startOfDay(to)) return 'range'
  } else if (sameDay(date, single.value)) {
    return 'selected'
  }

  if (outside) return 'outside'
  if (sameDay(date, new Date())) return 'today'
  return 'default'
}

function shiftMonth(step: number) {
  const next = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + step, 1)
  if (props.month === undefined) internalMonth.value = next
  emit('update:month', next)
}

function select(date: Date) {
  if (isDisabled(date)) return

  if (props.mode !== 'range') {
    emit('update:modelValue', date)
    return
  }

  const [from, to] = range.value
  // A completed range starts over; an open one closes, ordering itself.
  if (!from || (from && to)) {
    emit('update:modelValue', [date, null])
  } else {
    emit('update:modelValue', date < from ? [date, from] : [from, date])
  }
}

function applyPreset(daysBack: number | 'thisMonth') {
  const now = new Date()
  const today = startOfDay(now)
  if (daysBack === 'thisMonth') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    emit('update:modelValue', [first, last])
    internalMonth.value = first
    return
  }
  if (daysBack === 0) {
    if (props.mode === 'range') {
      emit('update:modelValue', [today, today])
    } else {
      emit('update:modelValue', today)
    }
    internalMonth.value = today
    return
  }
  const from = new Date(today)
  from.setDate(today.getDate() - daysBack)
  emit('update:modelValue', [from, today])
  internalMonth.value = today
}
</script>

<template>
  <div v-bind="$attrs" class="ev-calendar" role="group" :aria-label="monthLabel">
    <!-- Presets bar -->
    <div v-if="presets" class="ev-calendar__presets">
      <button type="button" class="ev-calendar__preset-btn" @click="applyPreset(0)">
        Hari Ini
      </button>
      <button type="button" class="ev-calendar__preset-btn" @click="applyPreset(7)">7 Hari</button>
      <button type="button" class="ev-calendar__preset-btn" @click="applyPreset(30)">
        30 Hari
      </button>
      <button type="button" class="ev-calendar__preset-btn" @click="applyPreset('thisMonth')">
        Bulan Ini
      </button>
    </div>

    <div class="ev-calendar__header">
      <button
        type="button"
        class="ev-calendar__nav"
        :aria-label="previousLabel"
        @click="shiftMonth(-1)"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M14.5 6L9 12l5.5 6"
            stroke="currentColor"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <span class="ev-calendar__month" aria-live="polite">{{ monthLabel }}</span>

      <button type="button" class="ev-calendar__nav" :aria-label="nextLabel" @click="shiftMonth(1)">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M9.5 6L15 12l-5.5 6"
            stroke="currentColor"
            stroke-width="1.6"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>

    <div class="ev-calendar__grid" role="grid">
      <span v-for="day in weekdays" :key="day" class="ev-calendar__weekday" role="columnheader">
        {{ day }}
      </span>

      <button
        v-for="cell in days"
        :key="cell.date.toISOString()"
        type="button"
        class="ev-calendar__day"
        :class="[
          `ev-calendar__day--${stateOf(cell.date, cell.outside)}`,
          { 'ev-calendar__day--event': hasEvent(cell.date) },
        ]"
        role="gridcell"
        :disabled="isDisabled(cell.date)"
        :aria-selected="
          ['selected', 'l-select', 'r-select'].includes(stateOf(cell.date, cell.outside))
        "
        @click="select(cell.date)"
      >
        {{ cell.date.getDate() }}
      </button>
    </div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-calendar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-lg);
  width: 312px;
  padding: var(--ev-spacing-lg);
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-bg-primary);

  &__presets {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    padding-bottom: var(--ev-spacing-sm);
    border-bottom: 1px solid var(--ev-border-secondary);
  }

  &__preset-btn {
    padding: 3px 8px;
    border: 1px solid var(--ev-border-primary);
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-bg-secondary);
    color: var(--ev-text-secondary);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background-color var(--ev-duration-fast),
      color var(--ev-duration-fast);

    &:hover {
      background-color: var(--ev-brand-primary-subtle);
      color: var(--ev-brand-primary);
      border-color: var(--ev-brand-primary);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ev-spacing-sm);
  }

  &__nav {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    padding: var(--ev-spacing-2xs);
    border: 0;
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-bg-secondary);
    color: var(--ev-icon-primary);
    cursor: pointer;

    svg {
      width: 24px;
      height: 24px;
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  &__month {
    color: var(--ev-text-primary);

    @include type.style('body/regular');
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 40px);
    gap: var(--ev-spacing-xs) 0;
    justify-content: center;
  }

  &__weekday {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    color: var(--ev-text-secondary);

    @include type.style('body/small');
  }

  &__day {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: var(--ev-stroke-xs) solid transparent;
    border-radius: var(--ev-radius-sm);
    background-color: transparent;
    color: var(--ev-text-primary);
    cursor: pointer;

    @include type.style('body/regular');

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: calc(var(--ev-focus-ring-offset) * -1);
      z-index: 1;
    }

    &:disabled {
      cursor: not-allowed;
    }

    /* The event dot the board's `Event` boolean adds. */
    &--event::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 50%;
      width: 4px;
      height: 4px;
      margin-left: -2px;
      border-radius: var(--ev-radius-rd);
      background-color: currentcolor;
    }

    &--today {
      border-color: var(--ev-brand-primary);
      border-radius: var(--ev-radius-xs);
    }

    &--selected {
      border-radius: var(--ev-radius-xs);
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);
    }

    /* Range ends: rounded on the outer corner only, so the band stays joined. */
    &--l-select {
      border-radius: var(--ev-radius-xs) 0 0 var(--ev-radius-xs);
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);
    }

    &--r-select {
      border-radius: 0 var(--ev-radius-xs) var(--ev-radius-xs) 0;
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);
    }

    &--range {
      border-radius: 0;
      background-color: var(--ev-brand-primary-subtle);
      color: var(--ev-brand-primary);
    }

    &--outside {
      color: var(--ev-text-tertiary);
    }

    &--disabled {
      color: var(--ev-text-disabled);
    }
  }
}
</style>
