import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvDataTable from './EvDataTable.vue'
import EvDataTableRow from './EvDataTableRow.vue'
import EvDataTableCell from './EvDataTableCell.vue'
import type { DataTableVariant } from '../../types'

const VARIANTS: DataTableVariant[] = [
  'default',
  'secondary',
  'no-fill',
  'left-fixed',
  'right-fixed',
]

const global = { components: { EvDataTableRow, EvDataTableCell } }

const table = (props: Record<string, unknown> = {}) =>
  mount(EvDataTable, {
    props,
    slots: {
      head: '<ev-data-table-row header><ev-data-table-cell header sortable>Nama</ev-data-table-cell></ev-data-table-row>',
      default:
        '<ev-data-table-row><ev-data-table-cell>Alex</ev-data-table-cell></ev-data-table-row>',
    },
    global,
  })

describe('EvDataTable', () => {
  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    expect(table({ variant }).classes()).toContain(`ev-data-table--${variant}`)
  })

  it('renders a real table with a head and a body', () => {
    const wrapper = table()
    expect(wrapper.find('table').exists()).toBe(true)
    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.find('tbody').exists()).toBe(true)
    expect(wrapper.find('th').text()).toBe('Nama')
    expect(wrapper.find('tbody td').text()).toBe('Alex')
  })

  // Board order: Frame 4 (title + actions), Filter, Table List, Pagination.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvDataTable, {
      props: { title: 'Karyawan' },
      slots: {
        actions: '<button />',
        filters: '<span />',
        pagination: '<nav />',
        default:
          '<ev-data-table-row><ev-data-table-cell>A</ev-data-table-cell></ev-data-table-row>',
      },
      global,
    })
    const parts = Array.from(wrapper.element.children).map(
      (el) => (el as Element).className.split(' ')[0],
    )
    expect(parts).toEqual([
      'ev-data-table__header',
      'ev-data-table__filters',
      'ev-data-table__list',
      'ev-data-table__pagination',
    ])
  })

  it('draws optional parts only when they are filled', () => {
    const wrapper = table()
    expect(wrapper.find('.ev-data-table__header').exists()).toBe(false)
    expect(wrapper.find('.ev-data-table__filters').exists()).toBe(false)
    expect(wrapper.find('.ev-data-table__pagination').exists()).toBe(false)
  })

  // The board drops the frame on the two fixed variants.
  it.each(['default', 'secondary', 'no-fill'] as const)('frames the %s variant', (variant) => {
    expect(table({ variant }).find('.ev-data-table__list').classes()).toContain(
      'ev-data-table__list--framed',
    )
  })

  it.each(['left-fixed', 'right-fixed'] as const)('drops the frame on %s', (variant) => {
    expect(table({ variant }).find('.ev-data-table__list').classes()).not.toContain(
      'ev-data-table__list--framed',
    )
  })

  it('drops the head when no header rows are given', () => {
    const wrapper = mount(EvDataTable, {
      slots: {
        default:
          '<ev-data-table-row><ev-data-table-cell>A</ev-data-table-cell></ev-data-table-row>',
      },
      global,
    })
    expect(wrapper.find('thead').exists()).toBe(false)
  })
})

describe('EvDataTableRow', () => {
  it('is a table row at level 0 by default', () => {
    const wrapper = mount(EvDataTableRow)
    expect(wrapper.element.tagName).toBe('TR')
    expect(wrapper.classes()).toContain('ev-data-table__row--level-0')
  })

  it.each([1, 2, 3, 4, 5] as const)('applies the level %i class', (level) => {
    expect(mount(EvDataTableRow, { props: { level } }).classes()).toContain(
      `ev-data-table__row--level-${level}`,
    )
  })

  it('marks a selected row', () => {
    const wrapper = mount(EvDataTableRow, { props: { selected: true } })
    expect(wrapper.classes()).toContain('ev-data-table__row--selected')
    expect(wrapper.attributes('aria-selected')).toBe('true')
  })

  // A header row is not selectable, so it must not claim to be.
  it('does not mark a header row as selectable', () => {
    const wrapper = mount(EvDataTableRow, { props: { header: true, selected: true } })
    expect(wrapper.attributes('aria-selected')).toBeUndefined()
  })
})

describe('EvDataTableCell', () => {
  it('is a td, and a th in the header', () => {
    expect(mount(EvDataTableCell).element.tagName).toBe('TD')
    const th = mount(EvDataTableCell, { props: { header: true } })
    expect(th.element.tagName).toBe('TH')
    expect(th.attributes('scope')).toBe('col')
  })

  it('draws the sort control only when sortable', () => {
    expect(mount(EvDataTableCell).find('.ev-data-table__sort').exists()).toBe(false)
    const wrapper = mount(EvDataTableCell, { props: { header: true, sortable: true } })
    expect(wrapper.find('.ev-data-table__sort').exists()).toBe(true)
    expect(wrapper.attributes('aria-sort')).toBe('none')
  })

  it('reports the sort direction and toggles it', async () => {
    const wrapper = mount(EvDataTableCell, { props: { header: true, sortable: true, sort: 'asc' } })
    expect(wrapper.attributes('aria-sort')).toBe('ascending')
    await wrapper.find('.ev-data-table__sort').trigger('click')
    expect(wrapper.emitted('sort')).toEqual([['desc']])
  })

  it('pins a column and offsets it', () => {
    const left = mount(EvDataTableCell, { props: { fixed: 'left', offset: 40 } })
    expect(left.classes()).toContain('ev-data-table__cell--fixed-left')
    expect(left.attributes('style')).toContain('left: 40px')
    const right = mount(EvDataTableCell, { props: { fixed: 'right' } })
    expect(right.classes()).toContain('ev-data-table__cell--fixed-right')
  })

  /*
   * .Table Row no Fill pads its body cells 8 and drops the rules; its
   * .Table Title does neither, so the header must not go compact.
   */
  it('goes compact only for body cells in a no-fill table', () => {
    const wrapper = mount(EvDataTable, {
      props: { variant: 'no-fill' },
      slots: {
        head: '<ev-data-table-row header><ev-data-table-cell header>Nama</ev-data-table-cell></ev-data-table-row>',
        default:
          '<ev-data-table-row><ev-data-table-cell>Alex</ev-data-table-cell></ev-data-table-row>',
      },
      global,
    })
    expect(wrapper.find('th').classes()).not.toContain('ev-data-table__cell--compact')
    expect(wrapper.find('td').classes()).toContain('ev-data-table__cell--compact')
  })

  it('stays roomy in a filled table', () => {
    const wrapper = table({ variant: 'default' })
    expect(wrapper.find('td').classes()).not.toContain('ev-data-table__cell--compact')
  })

  // The set's 16 Item Types are what the cell holds, not what it is.
  it('puts whatever it is given in the slot', () => {
    const wrapper = mount(EvDataTableCell, { slots: { default: '<span class="badge" />' } })
    expect(wrapper.find('.ev-data-table__cell-content .badge').exists()).toBe(true)
  })
})
