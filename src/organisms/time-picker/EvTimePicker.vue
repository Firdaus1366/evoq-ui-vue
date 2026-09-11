<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, type ComponentPublicInstance } from 'vue'
import EvButton from '../../atoms/button/EvButton.vue'

/*
 * Compiled 1:1 from the Figma node `Calendar & Time Picker / M - TimePickerPopup`
 * (COMPONENT_SET, 4 Variants). Every variant is 312x368, r8, #ffffff, 1px
 * #dbdfe9, VERTICAL gap 16, padding 24/16, holding three siblings:
 *
 *   Variant=<x>          VERTICAL g16 p24,16,24,16
 *   ├── Frame 28         280x16  H g8   the value, 14 Bold #1b84ff, + reset icon
 *   ├── Frame 18         280x184 H g8   the wheel
 *   │   ├── Frame 22     280x32  r8 #ebedf1   selection band, behind the columns
 *   │   ├── Frame 8      column  V g16  3 neighbours / value / 3 neighbours
 *   │   ├── Frame 9      20x184  V g4   the ":" separator, 14 Bold #071437
 *   │   └── Frame 11     column
 *   └── Frame 19         280x88  V g8   Apply (primary) then Cancel (sec-light)
 *
 * The board draws NO title above the value, and no per-column labels - the 20px
 * frame between columns holds a colon, not a caption. Apply sits ABOVE Cancel.
 */

defineOptions({
  name: 'EvTimePicker',
})

export type TimePickerFormat = 'default' | 'with-seconds' | 'am-pm' | 'am-pm-seconds'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    /** Figma's `Variant`: which columns the wheel shows. */
    format?: TimePickerFormat
    disabled?: boolean
    readonly?: boolean
    /** Figma's `Has Reset Button`: the refresh glyph beside the value. */
    hasReset?: boolean
    resetLabel?: string
    cancelLabel?: string
    applyLabel?: string
  }>(),
  {
    modelValue: '00:00',
    format: 'default',
    disabled: false,
    readonly: false,
    hasReset: false,
    resetLabel: 'Atur ulang',
    cancelLabel: 'Cancel',
    applyLabel: 'Apply',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  apply: [value: string]
  cancel: []
  reset: []
}>()

const is12Hour = computed(() => props.format === 'am-pm' || props.format === 'am-pm-seconds')
const showSeconds = computed(
  () => props.format === 'with-seconds' || props.format === 'am-pm-seconds',
)

const pad = (n: number) => String(n).padStart(2, '0')
const hours = computed(() =>
  is12Hour.value
    ? Array.from({ length: 12 }, (_, i) => pad(i + 1))
    : Array.from({ length: 24 }, (_, i) => pad(i)),
)
const minutes = Array.from({ length: 60 }, (_, i) => pad(i))
const seconds = Array.from({ length: 60 }, (_, i) => pad(i))
const periods = ['AM', 'PM']

const selectedHour = ref('00')
const selectedMinute = ref('00')
const selectedSecond = ref('00')
const selectedPeriod = ref('AM')

function parseValue(value: string) {
  if (!value) return
  const [clock, meridiem] = value.trim().split(' ')
  const [h = '00', m = '00', s = '00'] = (clock ?? '').split(':')
  selectedHour.value = h
  selectedMinute.value = m
  selectedSecond.value = s
  if (meridiem) selectedPeriod.value = meridiem
}

watch(() => props.modelValue, parseValue, { immediate: true })

const formatted = computed(() => {
  const clock = [selectedHour.value, selectedMinute.value]
  if (showSeconds.value) clock.push(selectedSecond.value)
  return is12Hour.value ? `${clock.join(':')} ${selectedPeriod.value}` : clock.join(':')
})

const inert = computed(() => props.disabled || props.readonly)

interface WheelColumn {
  key: string
  list: string[]
  value: string
  select: (value: string) => void
}

/**
 * DEVIATION: the board draws one frozen frame of a wheel - three neighbours at
 * 16/8 spacing, then the value at 24. Rendered literally that is only seven
 * reachable values per column, so 14:30 cannot become 14:45. The columns scroll
 * instead, on a uniform 32px pitch that matches the board's own selection band,
 * which keeps every drawn value in place and makes the other 53 reachable.
 */
/** 32px rows, padded by (184 - 32) / 2 = 76 in CSS so row 0 starts centred. */
const ITEM_HEIGHT = 32

const wheels = ref<Record<string, HTMLElement | null>>({})

function setWheel(key: string) {
  return (el: Element | ComponentPublicInstance | null) => {
    wheels.value[key] = el as HTMLElement | null
  }
}

/** Park the chosen value inside the band. */
function centre(key: string, list: string[], value: string, smooth = false) {
  const el = wheels.value[key]
  const at = list.indexOf(value)
  if (!el || at === -1) return
  // jsdom implements neither `scrollTo` nor smooth scrolling.
  if (typeof el.scrollTo === 'function') {
    el.scrollTo({ top: at * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' })
  } else {
    el.scrollTop = at * ITEM_HEIGHT
  }
}

function centreAll(smooth = false) {
  for (const column of columns.value) centre(column.key, column.list, column.value, smooth)
}

onMounted(() => centreAll())
watch(
  () => [props.modelValue, props.format],
  () => nextTick(() => centreAll()),
)

const columns = computed<WheelColumn[]>(() => {
  const out: WheelColumn[] = [
    {
      key: 'hour',
      list: hours.value,
      value: selectedHour.value,
      select: (v) => set('hour', v),
    },
    {
      key: 'minute',
      list: minutes,
      value: selectedMinute.value,
      select: (v) => set('minute', v),
    },
  ]
  if (showSeconds.value) {
    out.push({
      key: 'second',
      list: seconds,
      value: selectedSecond.value,
      select: (v) => set('second', v),
    })
  }
  if (is12Hour.value) {
    out.push({
      key: 'meridiem',
      list: periods,
      value: selectedPeriod.value,
      select: (v) => set('meridiem', v),
    })
  }
  return out
})

function set(part: string, value: string) {
  if (inert.value) return
  if (part === 'hour') selectedHour.value = value
  else if (part === 'minute') selectedMinute.value = value
  else if (part === 'second') selectedSecond.value = value
  else selectedPeriod.value = value
  emit('update:modelValue', formatted.value)
  nextTick(() => centreAll(true))
}

function onApply() {
  if (props.disabled) return
  emit('apply', formatted.value)
}

function onCancel() {
  if (props.disabled) return
  emit('cancel')
}

function onReset() {
  if (inert.value) return
  parseValue('00:00:00')
  selectedPeriod.value = 'AM'
  emit('update:modelValue', formatted.value)
  emit('reset')
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="ev-time-picker"
    :class="{ 'ev-time-picker--disabled': disabled }"
    role="group"
    :aria-label="formatted"
  >
    <!-- node: Frame 28 — the value, plus the optional reset glyph -->
    <div class="ev-time-picker__display">
      <span class="ev-time-picker__value">{{ formatted }}</span>
      <button
        v-if="hasReset"
        type="button"
        class="ev-time-picker__reset"
        :aria-label="resetLabel"
        :disabled="inert"
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

    <!-- node: Frame 18 — the wheel, with Frame 22 behind it -->
    <div class="ev-time-picker__wheel">
      <span class="ev-time-picker__band" aria-hidden="true" />

      <template v-for="(column, index) in columns" :key="column.key">
        <!-- node: Frame 9 — the ":" between numeric columns -->
        <span
          v-if="index > 0 && column.key !== 'meridiem'"
          class="ev-time-picker__separator"
          aria-hidden="true"
          >:</span
        >

        <div
          :ref="setWheel(column.key)"
          class="ev-time-picker__column"
          role="listbox"
          :aria-label="column.key"
        >
          <button
            v-for="item in column.list"
            :key="item"
            type="button"
            class="ev-time-picker__item"
            :class="{ 'ev-time-picker__item--selected': item === column.value }"
            role="option"
            :aria-selected="item === column.value"
            :disabled="inert"
            @click="column.select(item)"
          >
            {{ item }}
          </button>
        </div>
      </template>
    </div>

    <!-- node: Frame 19 — Apply above Cancel, both full-width Button atoms -->
    <div class="ev-time-picker__footer">
      <EvButton
        class="ev-time-picker__btn ev-time-picker__btn--apply"
        block
        :disabled="disabled"
        @click="onApply"
      >
        {{ applyLabel }}
      </EvButton>
      <EvButton
        class="ev-time-picker__btn ev-time-picker__btn--cancel"
        variant="secondary-light"
        block
        :disabled="disabled"
        @click="onCancel"
      >
        {{ cancelLabel }}
      </EvButton>
    </div>
  </div>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

.ev-time-picker {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--ev-spacing-lg);
  width: 312px;
  padding: var(--ev-spacing-xl) var(--ev-spacing-lg);
  border: var(--ev-stroke-xs) solid var(--ev-border-primary);
  border-radius: var(--ev-radius-sm);
  background-color: var(--ev-bg-primary);

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* node: Frame 28 */
  &__display {
    display: flex;
    align-items: center;
    gap: var(--ev-spacing-sm);
    height: 16px;
  }

  &__value {
    color: var(--ev-brand-primary);

    @include type.style('body/regular-b');
  }

  &__reset {
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

  /* node: Frame 18 */
  &__wheel {
    position: relative;
    display: flex;
    align-items: stretch;
    gap: var(--ev-spacing-sm);
    height: 184px;
  }

  /* node: Frame 22 — the band sits behind every column, centred. */
  &__band {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 32px;
    margin-top: -16px;
    border-radius: var(--ev-radius-sm);
    background-color: var(--ev-bg-subtle);
  }

  /* node: Frame 9 */
  &__separator {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    color: var(--ev-text-primary);

    @include type.style('body/regular-b');
  }

  /*
   * node: Frame 8 / Frame 11 - a scrolling column on a 32px pitch, so the value
   * always parks inside the band and every entry stays reachable.
   */
  &__column {
    position: relative;
    flex: 1 1 0%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    min-width: 0;
    height: 100%;
    padding: 76px 0;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__item {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ev-text-disabled);
    cursor: pointer;
    scroll-snap-align: center;

    @include type.style('body/regular');

    &:disabled {
      cursor: not-allowed;
    }

    /* The value is the one place the picker steps up to 18/24. */
    &--selected {
      color: var(--ev-text-primary);
      font-size: var(--ev-font-size-lg);
      font-weight: var(--ev-font-weight-bold);
      line-height: var(--ev-line-height-md);
    }
  }

  /* node: Frame 19 */
  &__footer {
    display: flex;
    flex-direction: column;
    gap: var(--ev-spacing-sm);
  }

  /*
   * Apply and Cancel are EvButton (primary / secondary-light, default size) -
   * their look belongs to the Button atom, so nothing here restyles them.
   */

  &--disabled {
    cursor: not-allowed;
  }
}
</style>
