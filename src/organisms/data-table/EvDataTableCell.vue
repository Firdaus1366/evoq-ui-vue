<script setup lang="ts">
import { computed, inject } from 'vue'
import { DATA_TABLE_KEY } from './context'
import type { DataTableSort, TableCellAlign } from '../../types'

defineOptions({
  name: 'EvDataTableCell',
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    /** Renders a `th` in the header row rather than a `td` in the body. */
    header?: boolean
    /** Draws the sort glyph the board puts on every `.Table Item` in a title row. */
    sortable?: boolean
    /** Which way the column is sorted right now. */
    sort?: DataTableSort
    align?: TableCellAlign
    /** Pins the column while the table scrolls sideways. */
    fixed?: 'left' | 'right' | false
    /** Distance from the pinned edge, for a second pinned column. */
    offset?: number | string
  }>(),
  {
    header: false,
    sortable: false,
    sort: 'none',
    align: 'left',
    fixed: false,
    offset: 0,
  },
)

const emit = defineEmits<{
  sort: [next: DataTableSort]
}>()

const table = inject(DATA_TABLE_KEY, undefined)
/**
 * `.Table Row no Fill` pads its cells 8 and drops the rules between them.
 * Its `.Table Title` does neither - the header row is the same on all three
 * fill variants - so this is a body-cell concern only.
 */
const compact = computed(() => !props.header && table?.variant.value === 'no-fill')

const style = computed(() => {
  if (!props.fixed) return undefined
  const edge = typeof props.offset === 'number' ? `${props.offset}px` : props.offset
  return props.fixed === 'left' ? { left: edge } : { right: edge }
})

function toggle() {
  if (!props.sortable) return
  emit('sort', props.sort === 'asc' ? 'desc' : 'asc')
}
</script>

<template>
  <component
    :is="header ? 'th' : 'td'"
    v-bind="$attrs"
    class="ev-data-table__cell"
    :class="[
      `ev-data-table__cell--${align}`,
      {
        'ev-data-table__cell--header': header,
        'ev-data-table__cell--compact': compact,
        'ev-data-table__cell--fixed': fixed,
        'ev-data-table__cell--fixed-left': fixed === 'left',
        'ev-data-table__cell--fixed-right': fixed === 'right',
      },
    ]"
    :scope="header ? 'col' : undefined"
    :aria-sort="
      header && sortable ? { asc: 'ascending', desc: 'descending', none: 'none' }[sort] : undefined
    "
    :style="style"
  >
    <span class="ev-data-table__cell-inner">
      <span class="ev-data-table__cell-content"><slot /></span>
      <button
        v-if="sortable"
        type="button"
        class="ev-data-table__sort"
        :class="`ev-data-table__sort--${sort}`"
        @click="toggle"
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M5 6.5L8 3.5l3 3M5 9.5l3 3 3-3"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </span>
  </component>
</template>

<style lang="scss">
@use '../../styles/typography' as type;

/*
 * Traced from the `.Table Item` component set (16 Types) and from the cells
 * inside `.Table Title`, `.Table Row` and `.Table Row no Fill`.
 *
 * Node tree, in board order:
 *   .Table Item  HORIZONTAL, padding 12 inside a .Table Row and a
 *                .Table Title, padding 8 inside a .Table Row no Fill
 *     Text       HORIZONTAL, gap 4 - the content
 *     Icon       16, the sort glyph, on title cells only
 *
 * Every cell after the first in a filled row carries a 1px left border; the
 * no-fill row carries none. That is `border-left` on the cell here, dropped
 * from the first cell by `:first-child`, so a column added or removed cannot
 * leave a stray rule.
 *
 * The set's 16 Types are what the cell *holds*, not what it is: Checkbox,
 * Badge, Field, Dropdown, Toggle and Tree are instances of components that
 * already exist in the package. They go in the slot; the cell stays a cell.
 */
.ev-data-table__cell {
  box-sizing: border-box;
  padding: var(--ev-spacing-md);
  border-left: var(--ev-stroke-xs) solid var(--ev-border-primary);
  color: var(--ev-text-primary);
  text-align: left;
  vertical-align: middle;

  @include type.style('body/regular');

  &:first-child {
    border-left: 0;
  }

  &--compact {
    padding: var(--ev-spacing-sm);
    border-left: 0;
  }

  &--center {
    text-align: center;
  }

  &--right {
    text-align: right;
  }

  /*
   * The Default title row paints its labels #4b5675, which is grey/700 in the
   * library ramp and carries no semantic token. It is read from the ramp
   * rather than rounded to text/primary or text/secondary, neither of which
   * it is. EvDataTable overrides the custom property for its other variants.
   */
  &--header {
    color: var(--ev-data-table-title-fg, var(--ev-grey-700));
    font-weight: var(--ev-font-weight-medium);
    white-space: nowrap;
  }

  &--fixed {
    position: sticky;
    z-index: 1;
    background-color: inherit;
  }

  &--fixed-left {
    box-shadow: var(--ev-shadow-table-left);
  }

  &--fixed-right {
    box-shadow: var(--ev-shadow-table-right);
  }
}

.ev-data-table__cell-inner {
  display: flex;
  align-items: center;
  gap: var(--ev-spacing-xs);
}

.ev-data-table__cell--center .ev-data-table__cell-inner {
  justify-content: center;
}

.ev-data-table__cell--right .ev-data-table__cell-inner {
  justify-content: flex-end;
}

.ev-data-table__cell-content {
  min-width: 0;
}

.ev-data-table__sort {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  padding: 0;
  border: 0;
  background: none;
  color: currentcolor;
  cursor: pointer;

  svg {
    width: 16px;
    height: 16px;
  }

  &:focus-visible {
    outline: var(--ev-focus-ring-width) solid var(--ev-focus-ring-color);
    outline-offset: var(--ev-focus-ring-offset);
  }
}
</style>
