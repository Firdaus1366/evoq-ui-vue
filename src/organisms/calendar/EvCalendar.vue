<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CalendarMode, CalendarPlatform, CalendarView } from '../../types'
import EvDropdownList from '../dropdown-list/EvDropdownList.vue'
import EvDropdownItem from '../dropdown-list/EvDropdownItem.vue'

defineOptions({
  name: 'EvCalendar',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** A single date, or a `[from, to]` pair in range mode. */
    modelValue?: Date | [Date | null, Date | null] | null
    mode?: CalendarMode
    /**
     * Which grid to draw. `month` and `year` are the board's `Month` / `Year`
     * variants, and the same two grids back the desktop `Month Open` and
     * `Year Open` overlays.
     */
    view?: CalendarView
    /**
     * `desktop` is the `D - Calendar` board; `mobile` is `M - CalendarPopup` -
     * bare chevrons, a value read-out above the footer, and footer buttons
     * split evenly rather than sitting right-aligned.
     */
    platform?: CalendarPlatform
    /** How many month blocks the `full` view stacks. */
    fullMonths?: number
    /** Figma's `Month Open` / `Year Open` overlays on the desktop header. */
    monthOpen?: boolean
    yearOpen?: boolean
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
    /** Figma's `Basic Preset` / `Range Preset`: the quick-select row below the grid. */
    presets?: boolean
    /** Figma's `Has Reset Button` on the footer row. */
    hasReset?: boolean
    /** The board's `Select Time` link, drawn under the Basic variant. */
    showTimeLink?: boolean
    previousLabel?: string
    nextLabel?: string
    cancelLabel?: string
    applyLabel?: string
    resetLabel?: string
    timeLinkLabel?: string
  }>(),
  {
    modelValue: null,
    mode: 'single',
    view: 'day',
    platform: 'desktop',
    fullMonths: 12,
    monthOpen: false,
    yearOpen: false,
    month: undefined,
    min: undefined,
    max: undefined,
    weekStartsOn: 1,
    locale: 'id-ID',
    events: () => [],
    presets: false,
    hasReset: false,
    showTimeLink: false,
    previousLabel: 'Bulan sebelumnya',
    nextLabel: 'Bulan berikutnya',
    cancelLabel: 'Cancel',
    applyLabel: 'Apply',
    resetLabel: 'Reset',
    timeLinkLabel: 'Select Time',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Date | [Date | null, Date | null] | null]
  'update:month': [value: Date]
  'update:view': [value: CalendarView]
  'update:monthOpen': [value: boolean]
  'update:yearOpen': [value: boolean]
  apply: [value: Date | [Date | null, Date | null] | null]
  cancel: []
  reset: []
  'select-time': []
}>()

/** Midnight, so every comparison is date-only and time never leaks in. */
/** The board's year grid and year overlay both page in blocks of 36. */
const YEAR_BLOCK = 36

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
function daysFor(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const lead = (first.getDay() - props.weekStartsOn + 7) % 7
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - lead)

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { date, outside: date.getMonth() !== month.getMonth() }
  })
}

/**
 * `Variant=Range` draws two month panels side by side in `Frame 12`, the first
 * carrying the back chevron and the second the forward one.
 */
const panels = computed(() => {
  const months =
    props.mode === 'range'
      ? [
          viewMonth.value,
          new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + 1, 1),
        ]
      : [viewMonth.value]

  return months.map((month) => ({
    key: `${month.getFullYear()}-${month.getMonth()}`,
    label: new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }).format(month),
    days: daysFor(month),
  }))
})

/*
 * node: Frame 2 - twelve month cells, three across, wrapping with a row gap of
 * 8. The board reuses `.DayCell` at 93x40, so the day states carry straight
 * over: `Today` outlines the current month, `Selected` fills the chosen one.
 */
const monthCells = computed(() => {
  const fmt = new Intl.DateTimeFormat(props.locale, { month: 'short' })
  const now = new Date()
  const chosen = single.value ?? range.value[0]
  const year = viewMonth.value.getFullYear()

  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(year, index, 1)
    let state = 'default'
    if (chosen && chosen.getFullYear() === year && chosen.getMonth() === index) state = 'selected'
    else if (now.getFullYear() === year && now.getMonth() === index) state = 'today'
    return { key: `${year}-${index}`, label: fmt.format(date), date, state }
  })
})

/** node: Frame 8 - a 36-year block ending on the year in view, three across. */

const yearCells = computed(() => {
  const end = viewMonth.value.getFullYear()
  const start = end - (YEAR_BLOCK - 1)
  const now = new Date().getFullYear()
  const chosen = single.value ?? range.value[0]

  return Array.from({ length: YEAR_BLOCK }, (_, index) => {
    const year = start + index
    let state = 'default'
    if (chosen && chosen.getFullYear() === year) state = 'selected'
    else if (year === now) state = 'today'
    return { key: String(year), label: String(year), year, state }
  })
})

/** node: Frame 11 - the year grid labels its block instead of one month. */
const yearRangeLabel = computed(() => {
  const end = viewMonth.value.getFullYear()
  return `${end - (YEAR_BLOCK - 1)} - ${end}`
})

/** Month pages by the year; the day grid pages by the month. */
function shiftYear(step: number) {
  const next = new Date(viewMonth.value.getFullYear() + step, viewMonth.value.getMonth(), 1)
  if (props.month === undefined) internalMonth.value = next
  emit('update:month', next)
}

function pickMonth(date: Date) {
  if (props.month === undefined) internalMonth.value = date
  emit('update:month', date)
  emit('update:view', 'day')
}

function pickYear(year: number) {
  const next = new Date(year, viewMonth.value.getMonth(), 1)
  if (props.month === undefined) internalMonth.value = next
  emit('update:month', next)
  emit('update:view', 'month')
}

/** The board's `Filter` row, in its drawn order. */
const PRESETS = [
  'yesterday',
  'today',
  'tomorrow',
  'this-week',
  'last-week',
  'this-month',
  'last-month',
] as const

export type CalendarPreset = (typeof PRESETS)[number]

const presetLabels: Record<CalendarPreset, string> = {
  yesterday: 'Yesterday',
  today: 'Today',
  tomorrow: 'Tomorrow',
  'this-week': 'This week',
  'last-week': 'Last week',
  'this-month': 'This month',
  'last-month': 'Last month',
}

const presetList = computed(() => PRESETS.map((id) => ({ id, label: presetLabels[id] })))

/** node: Frame 8 - the `full` view stacks month blocks and scrolls. */
const fullBlocks = computed(() =>
  Array.from({ length: props.fullMonths }, (_, index) => {
    const month = new Date(viewMonth.value.getFullYear(), viewMonth.value.getMonth() + index, 1)
    return {
      key: `${month.getFullYear()}-${month.getMonth()}`,
      label: new Intl.DateTimeFormat(props.locale, { month: 'long', year: 'numeric' }).format(
        month,
      ),
      days: daysFor(month),
    }
  }),
)

const isMobile = computed(() => props.platform === 'mobile')

/** Range draws a footer; so do the Preset variants and every mobile board. */
const hasFooter = computed(() => props.mode === 'range' || props.presets || isMobile.value)

/**
 * node: Frame 26 - the mobile boards read the chosen value back above the
 * buttons, in the same 14 Bold brand treatment the time picker uses.
 */
const readoutLabel = computed(() => {
  const fmt = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat(props.locale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(d)
      : 'DD MMM YYYY'
  return props.mode === 'range' ? rangeLabel.value : fmt(single.value)
})

/** node: DropdownList - the desktop header's Month Open / Year Open overlays. */
const monthOptions = computed(() => {
  const fmt = new Intl.DateTimeFormat(props.locale, { month: 'long' })
  const year = viewMonth.value.getFullYear()
  return Array.from({ length: 12 }, (_, index) => ({
    key: `${year}-${index}`,
    label: fmt.format(new Date(year, index, 1)),
    date: new Date(year, index, 1),
    active: index === viewMonth.value.getMonth(),
  }))
})

const yearOptions = computed(() => {
  const end = viewMonth.value.getFullYear()
  const start = end - (YEAR_BLOCK - 1)
  return Array.from({ length: YEAR_BLOCK }, (_, index) => {
    const year = start + index
    return { key: String(year), label: String(year), year, active: year === end }
  })
})

function toggleMonthOverlay() {
  emit('update:yearOpen', false)
  emit('update:monthOpen', !props.monthOpen)
}

function toggleYearOverlay() {
  emit('update:monthOpen', false)
  emit('update:yearOpen', !props.yearOpen)
}

function chooseMonth(date: Date) {
  if (props.month === undefined) internalMonth.value = date
  emit('update:month', date)
  emit('update:monthOpen', false)
}

/*
 * The board models both overlays as booleans, so they are prop-driven. The
 * header label toggles the month one for convenience; the year one is exposed
 * for a host that wants to drive it from its own control.
 */
defineExpose({ toggleMonthOverlay, toggleYearOverlay })

function chooseYear(year: number) {
  const next = new Date(year, viewMonth.value.getMonth(), 1)
  if (props.month === undefined) internalMonth.value = next
  emit('update:month', next)
  emit('update:yearOpen', false)
}

/** The Preset variants move the padding off the root onto each band. */
const sectioned = computed(() => props.presets)

const rangeLabel = computed(() => {
  const fmt = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat(props.locale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }).format(d)
      : 'DD MMM YYYY'
  const [from, to] = range.value
  return `${fmt(from)} - ${fmt(to)}`
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

/** Resolve one of the board's seven presets into a date or a range. */
function applyPreset(id: CalendarPreset) {
  const today = startOfDay(new Date())
  const shift = (days: number) => {
    const d = new Date(today)
    d.setDate(today.getDate() + days)
    return d
  }
  const weekStart = (offset: number) => {
    const d = new Date(today)
    d.setDate(today.getDate() - ((today.getDay() - props.weekStartsOn + 7) % 7) + offset * 7)
    return d
  }
  const monthStart = (offset: number) => new Date(today.getFullYear(), today.getMonth() + offset, 1)

  let from: Date
  let to: Date

  switch (id) {
    case 'yesterday':
      from = to = shift(-1)
      break
    case 'tomorrow':
      from = to = shift(1)
      break
    case 'this-week':
      from = weekStart(0)
      to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6)
      break
    case 'last-week':
      from = weekStart(-1)
      to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6)
      break
    case 'this-month':
      from = monthStart(0)
      to = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      break
    case 'last-month':
      from = monthStart(-1)
      to = new Date(today.getFullYear(), today.getMonth(), 0)
      break
    default:
      from = to = today
  }

  emit('update:modelValue', props.mode === 'range' ? [from, to] : from)
  if (props.month === undefined)
    internalMonth.value = new Date(from.getFullYear(), from.getMonth(), 1)
}

function onApply() {
  emit('apply', props.modelValue)
}

function onReset() {
  emit('update:modelValue', props.mode === 'range' ? [null, null] : null)
  emit('reset')
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-calendar"
    :class="[
      `ev-calendar--${mode}`,
      `ev-calendar--${platform}`,
      { 'ev-calendar--sectioned': sectioned },
    ]"
    role="group"
    :aria-label="monthLabel"
  >
    <!-- node: Calendar — header + grid. Carries the padding on the Preset variants. -->
    <div class="ev-calendar__calendar">
      <!-- node: Frame 7 + Frame 2 — the Month variant pages by year -->
      <div v-if="view === 'month'" class="ev-calendar__panel">
        <div class="ev-calendar__header">
          <button
            type="button"
            class="ev-calendar__nav"
            :aria-label="previousLabel"
            @click="shiftYear(-1)"
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

          <span class="ev-calendar__month" aria-live="polite">
            {{ viewMonth.getFullYear() }}
          </span>

          <button
            type="button"
            class="ev-calendar__nav"
            :aria-label="nextLabel"
            @click="shiftYear(1)"
          >
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

        <div class="ev-calendar__cells" role="grid">
          <button
            v-for="cell in monthCells"
            :key="cell.key"
            type="button"
            class="ev-calendar__day ev-calendar__day--wide"
            :class="`ev-calendar__day--${cell.state}`"
            role="gridcell"
            :aria-selected="cell.state === 'selected'"
            @click="pickMonth(cell.date)"
          >
            {{ cell.label }}
          </button>
        </div>
      </div>

      <!-- node: Frame 11 + Frame 8 — the Year variant labels a 36-year block -->
      <div v-else-if="view === 'year'" class="ev-calendar__panel">
        <div class="ev-calendar__header ev-calendar__header--plain">
          <span class="ev-calendar__month" aria-live="polite">{{ yearRangeLabel }}</span>
        </div>

        <div class="ev-calendar__cells" role="grid">
          <button
            v-for="cell in yearCells"
            :key="cell.key"
            type="button"
            class="ev-calendar__day ev-calendar__day--wide"
            :class="`ev-calendar__day--${cell.state}`"
            role="gridcell"
            :aria-selected="cell.state === 'selected'"
            @click="pickYear(cell.year)"
          >
            {{ cell.label }}
          </button>
        </div>
      </div>

      <!-- node: Date — the Full Calendar variant stacks month blocks and scrolls -->
      <div v-else-if="view === 'full'" class="ev-calendar__full">
        <div v-for="block in fullBlocks" :key="block.key" class="ev-calendar__block">
          <span class="ev-calendar__block-label">{{ block.label }}</span>

          <div class="ev-calendar__grid" role="grid">
            <div class="ev-calendar__weekdays" role="row">
              <span
                v-for="day in weekdays"
                :key="day"
                class="ev-calendar__weekday"
                role="columnheader"
                >{{ day }}</span
              >
            </div>

            <div class="ev-calendar__days">
              <button
                v-for="cell in block.days"
                :key="cell.date.toISOString()"
                type="button"
                class="ev-calendar__day"
                :class="[
                  `ev-calendar__day--${stateOf(cell.date, cell.outside)}`,
                  { 'ev-calendar__day--event': hasEvent(cell.date) },
                ]"
                role="gridcell"
                :disabled="isDisabled(cell.date)"
                @click="select(cell.date)"
              >
                {{ cell.date.getDate() }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- node: Frame 12 — one panel for Basic, two side by side for Range -->
      <div v-else class="ev-calendar__months">
        <div v-for="(panel, index) in panels" :key="panel.key" class="ev-calendar__panel">
          <div class="ev-calendar__header">
            <button
              v-if="index === 0"
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

            <span class="ev-calendar__month-wrap">
              <button
                type="button"
                class="ev-calendar__month"
                aria-live="polite"
                :aria-expanded="monthOpen || yearOpen"
                @click="index === 0 && toggleMonthOverlay()"
              >
                {{ panel.label }}
              </button>

              <!-- node: DropdownList — Month Open / Year Open float over the header -->
              <EvDropdownList
                v-if="index === 0 && (monthOpen || yearOpen)"
                class="ev-calendar__overlay"
                scrollable
                :label="monthOpen ? 'Pilih bulan' : 'Pilih tahun'"
              >
                <template v-if="monthOpen">
                  <EvDropdownItem
                    v-for="option in monthOptions"
                    :key="option.key"
                    :active="option.active"
                    @click="chooseMonth(option.date)"
                    >{{ option.label }}</EvDropdownItem
                  >
                </template>
                <template v-else>
                  <EvDropdownItem
                    v-for="option in yearOptions"
                    :key="option.key"
                    :active="option.active"
                    @click="chooseYear(option.year)"
                    >{{ option.label }}</EvDropdownItem
                  >
                </template>
              </EvDropdownList>
            </span>

            <button
              v-if="index === panels.length - 1"
              type="button"
              class="ev-calendar__nav"
              :aria-label="nextLabel"
              @click="shiftMonth(1)"
            >
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

          <!-- node: Frame 8 — the weekday row and the day rows, gap 4 between them -->
          <div class="ev-calendar__grid" role="grid">
            <div class="ev-calendar__weekdays" role="row">
              <span
                v-for="day in weekdays"
                :key="day"
                class="ev-calendar__weekday"
                role="columnheader"
                >{{ day }}</span
              >
            </div>

            <div class="ev-calendar__days">
              <button
                v-for="cell in panel.days"
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
        </div>
      </div>
    </div>

    <!-- node: Filter — the seven quick-selects, BELOW the calendar -->
    <div v-if="presets" class="ev-calendar__filter">
      <button
        v-for="preset in presetList"
        :key="preset.id"
        type="button"
        class="ev-calendar__preset"
        @click="applyPreset(preset.id)"
      >
        {{ preset.label }}
      </button>
    </div>

    <!-- node: Frame 19 — the range label sits left of Cancel / Apply -->
    <div v-if="hasFooter" class="ev-calendar__footer">
      <!-- node: Frame 26 — the mobile boards read the value back above the buttons -->
      <div v-if="isMobile" class="ev-calendar__readout">
        <span class="ev-calendar__readout-value">{{ readoutLabel }}</span>
        <button
          v-if="hasReset"
          type="button"
          class="ev-calendar__readout-reset"
          :aria-label="resetLabel"
          @click="onReset"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path
              d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5V5h-2.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="ev-calendar__footer-row">
        <span v-if="mode === 'range'" class="ev-calendar__range-label">{{ rangeLabel }}</span>
        <button
          v-if="hasReset && !isMobile"
          type="button"
          class="ev-calendar__btn ev-calendar__btn--reset"
          @click="onReset"
        >
          {{ resetLabel }}
        </button>
        <button
          type="button"
          class="ev-calendar__btn ev-calendar__btn--cancel"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button type="button" class="ev-calendar__btn ev-calendar__btn--apply" @click="onApply">
          {{ applyLabel }}
        </button>
      </div>
    </div>

    <!-- node: ButtonLink — the Basic variant ends with "Select Time" -->
    <button
      v-else-if="showTimeLink"
      type="button"
      class="ev-calendar__time-link"
      @click="emit('select-time')"
    >
      {{ timeLinkLabel }}
    </button>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-calendar {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-lg);
  /*
   * The board sizes Basic at 312 and Range at 608 - both are 280px panels plus
   * the 16px padding, so the width follows the panel count rather than being
   * pinned, or Range squashes its two months into one column's worth.
   */
  width: fit-content;
  padding: var(--ev-spacing-lg);
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-bg-primary);

  /*
   * The two Preset variants move the padding off the root onto each band -
   * root p0 g0, with Calendar / Filter / Button padded individually.
   */
  &--sectioned {
    gap: 0;
    padding: 0;
  }

  /* node: Calendar */
  &__calendar {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-lg);
  }

  &--sectioned &__calendar {
    padding: var(--ev-spacing-lg);
  }

  /* node: Frame 12 — the month panels sit side by side at gap 16 */
  &__months {
    display: flex;
    gap: var(--ev-spacing-lg);
  }

  /*
   * node: Frame 2 / Frame 8 - the Month and Year grids wrap three cells across
   * at 93x40 with no column gap and a row gap of 8.
   */
  &__cells {
    display: grid;
    grid-template-columns: repeat(3, 93px);
    column-gap: 0;
    row-gap: var(--ev-spacing-sm);
    justify-content: center;
  }

  /* node: Frame 11 - the Year grid labels its block and pages no further. */
  &__header--plain {
    justify-content: center;
    padding: var(--ev-spacing-xs);
  }

  /*
   * node: Date - the Full Calendar variant stacks month blocks at gap 8 and
   * scrolls; each block labels itself instead of paging.
   */
  &__full {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
    max-height: var(--ev-calendar-full-height, 524px);
    overflow-y: auto;
  }

  &__block {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__block-label {
    padding: var(--ev-spacing-xs) 0;
    color: var(--ev-text-primary);

    @include type.style('body/regular');
  }

  /* node: DropdownList - the header overlay floats, it does not push. */
  &__month-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  &__overlay {
    position: absolute;
    top: calc(100% + var(--ev-spacing-xs));
    left: 0;
    z-index: var(--ev-z-dropdown);
    min-width: 106px;
  }

  /* node: Frame 13 / Frame 14 - each month panel is a fixed 280 wide. */
  &__panel {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
    width: 280px;
  }

  /*
   * node: Filter — a wrapping row of 32px quick-selects BELOW the calendar.
   * The board draws them on the card's own surface, with no border.
   */
  &__filter {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ev-spacing-sm);
    padding: var(--ev-spacing-lg) var(--ev-spacing-sm);
  }

  &__preset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ev-spacing-2xs);
    min-height: 32px;
    padding: var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid transparent;
    border-radius: var(--ev-radius-xs);
    background-color: var(--ev-bg-primary);
    color: var(--ev-text-primary);
    cursor: pointer;

    @include type.style('body/regular');

    &:hover {
      background-color: var(--ev-bg-secondary);
    }

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
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
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-text-primary);
    cursor: pointer;

    @include type.style('body/regular');

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }

  /* node: Frame 26 - the mobile value read-out, 14 Bold in the brand colour. */
  &__readout {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    height: 16px;
    margin-bottom: var(--ev-spacing-lg);
  }

  &__readout-value {
    color: var(--ev-brand-primary);

    @include type.style('body/regular-b');
  }

  &__readout-reset {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-icon-secondary);
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
      display: block;
    }
  }

  /*
   * node: Frame 19 on the mobile boards - two 136px buttons splitting the row
   * evenly, where the desktop footer sits right-aligned at its natural width.
   */
  &--mobile &__footer-row &__btn {
    flex: 1 1 0%;
    min-height: 40px;
    padding: var(--ev-spacing-md) var(--ev-spacing-lg);
  }

  /* The mobile header draws bare 24px chevrons, with no grey tile behind. */
  &--mobile &__nav {
    width: 24px;
    height: 24px;
    padding: 0;
    border-radius: 0;
    background-color: transparent;
  }

  &--mobile &__btn--cancel {
    border-color: var(--ev-brand-primary-200);
    background-color: var(--ev-brand-primary-subtle);
    color: var(--ev-brand-primary);
  }

  /* node: Frame 8 — weekday row over the day rows, gap 4 between the two. */
  &__grid {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-xs);
  }

  &__weekdays,
  &__days {
    display: grid;
    grid-template-columns: repeat(7, 40px);
    /* The board leaves no gap between day rows - only above the first one. */
    gap: 0;
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

    /* The Month and Year cells are the same DayCell, drawn 93 wide. */
    &--wide {
      width: 93px;
    }

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

  /* node: Button / Frame 19 — the action row */
  &__footer-row {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
  }

  &--sectioned &__footer {
    padding: var(--ev-spacing-lg);
  }

  /* node: Frame 26 — the range read-out, pushed left of the buttons */
  &__range-label {
    flex: 1 1 auto;
    color: var(--ev-text-secondary);

    @include type.style('body/regular');
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ev-spacing-2xs);
    min-height: 32px;
    padding: var(--ev-spacing-sm);
    border: var(--ev-stroke-xs) solid transparent;
    border-radius: var(--ev-radius-xs);
    cursor: pointer;

    @include type.style('body/regular');

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }

    /* The board's Cancel is the secondary-grey button. */
    &--cancel,
    &--reset {
      border-color: var(--ev-border-primary);
      background-color: var(--ev-bg-tertiary);
      color: var(--ev-text-primary);
    }

    &--apply {
      background-color: var(--ev-brand-primary);
      color: var(--ev-text-inverse);
    }
  }

  /*
   * node: ButtonLink — the Basic variant closes with "Select Time", padded
   * 8 top and bottom and spanning the grid.
   */
  &__time-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--ev-spacing-xs);
    width: 100%;
    padding: var(--ev-spacing-sm) 0;
    border: 0;
    background: none;
    color: var(--ev-text-primary);
    cursor: pointer;

    @include type.style('body/regular');

    &:focus-visible {
      outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
      outline-offset: var(--ev-focus-ring-offset);
    }
  }
}
</style>
