import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvPagination from './EvPagination.vue'
import EvButton from '../../atoms/button/EvButton.vue'
import EvPaginationItem from '../../atoms/pagination-item/EvPaginationItem.vue'
import type { PaginationVariant } from '../../types'

const VARIANTS: PaginationVariant[] = ['display', 'step', 'number']

describe('EvPagination', () => {
  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    expect(mount(EvPagination, { props: { variant } }).classes()).toContain(
      `ev-pagination--${variant}`,
    )
  })

  it('is a labelled navigation landmark', () => {
    const wrapper = mount(EvPagination, { props: { label: 'Halaman tabel' } })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Halaman tabel')
  })

  /*
   * Every control on this set is an instance, so all three variants have to
   * compose EvButton and EvPaginationItem instead of redrawing them.
   */
  it('composes EvButton on the display variant', () => {
    const wrapper = mount(EvPagination, { props: { variant: 'display', pageCount: 5 } })
    const buttons = wrapper.findAllComponents(EvButton)
    expect(buttons).toHaveLength(3)
    expect(buttons.map((b) => `${b.props('variant')}/${b.props('size')}`)).toEqual([
      'outline/small',
      'ghost/small',
      'ghost/small',
    ])
  })

  it('composes two secondary-light buttons on the step variant', () => {
    const wrapper = mount(EvPagination, { props: { variant: 'step', page: 2, pageCount: 5 } })
    const buttons = wrapper.findAllComponents(EvButton)
    expect(buttons).toHaveLength(2)
    expect(buttons.map((b) => `${b.props('variant')}/${b.props('size')}`)).toEqual([
      'secondary-light/default',
      'secondary-light/default',
    ])
    expect(wrapper.find('.ev-pagination__caption').text()).toBe('Step 2 of 5')
  })

  it('lets the step caption be overridden', () => {
    const wrapper = mount(EvPagination, {
      props: { variant: 'step', stepLabel: 'Langkah 2 dari 5' },
    })
    expect(wrapper.find('.ev-pagination__caption').text()).toBe('Langkah 2 dari 5')
  })

  it('composes EvPaginationItem tiles on the number variant', () => {
    const wrapper = mount(EvPagination, {
      props: { variant: 'number', page: 1, pageCount: 3 },
    })
    const tiles = wrapper.findAllComponents(EvPaginationItem)
    expect(tiles.map((t) => t.props('page'))).toEqual([1, 2, 3])
    expect(tiles[0]!.props('active')).toBe(true)
  })

  // First, last, a window around the current page, an ellipsis for each gap.
  it('inserts an ellipsis where pages are hidden', () => {
    const wrapper = mount(EvPagination, {
      props: { variant: 'number', page: 6, pageCount: 12 },
    })
    const tiles = wrapper.findAllComponents(EvPaginationItem)
    expect(tiles.map((t) => (t.props('more') ? '…' : t.props('page')))).toEqual([
      1,
      '…',
      5,
      6,
      7,
      '…',
      12,
    ])
  })

  it('draws no ellipsis when every page fits', () => {
    const wrapper = mount(EvPagination, { props: { variant: 'number', page: 2, pageCount: 3 } })
    expect(wrapper.findAllComponents(EvPaginationItem).some((t) => t.props('more'))).toBe(false)
  })

  it('moves the page and emits on the arrows', async () => {
    const wrapper = mount(EvPagination, { props: { variant: 'number', page: 2, pageCount: 5 } })
    const [prev, next] = wrapper.findAllComponents(EvButton)
    await next!.trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
    expect(wrapper.emitted('update:page')).toEqual([[3]])
    await prev!.trigger('click')
    expect(wrapper.emitted('previous')).toHaveLength(1)
    expect(wrapper.emitted('update:page')).toEqual([[3], [1]])
  })

  it('disables the arrows at the ends', () => {
    const first = mount(EvPagination, { props: { variant: 'number', page: 1, pageCount: 5 } })
    expect(first.findAllComponents(EvButton)[0]!.props('disabled')).toBe(true)
    const last = mount(EvPagination, { props: { variant: 'number', page: 5, pageCount: 5 } })
    expect(last.findAllComponents(EvButton)[1]!.props('disabled')).toBe(true)
  })

  it('does not move past either end', async () => {
    const wrapper = mount(EvPagination, { props: { variant: 'number', page: 1, pageCount: 3 } })
    const tiles = wrapper.findAllComponents(EvPaginationItem)
    await tiles[0]!.trigger('click')
    expect(wrapper.emitted('update:page')).toBeUndefined()
  })

  it('reports the rows-per-page press without owning the menu', async () => {
    const wrapper = mount(EvPagination, { props: { variant: 'display', rowsPerPage: 25 } })
    const rows = wrapper.findAllComponents(EvButton)[0]!
    expect(rows.text()).toContain('25')
    await rows.trigger('click')
    expect(wrapper.emitted('rows-per-page')).toHaveLength(1)
  })
})
