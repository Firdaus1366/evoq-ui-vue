import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import EvDropdownItem from './EvDropdownItem.vue'
import EvDropdownList from './EvDropdownList.vue'

describe('EvDropdownList', () => {
  it('is a listbox with no search by default', () => {
    const wrapper = mount(EvDropdownList, { props: { label: 'Vendor' } })
    const options = wrapper.find('.ev-dropdown-list__options')
    expect(options.attributes('role')).toBe('listbox')
    expect(options.attributes('aria-label')).toBe('Vendor')
    expect(wrapper.find('.ev-dropdown-list__search').exists()).toBe(false)
  })

  it('adds the search field for the combobox pattern', async () => {
    const wrapper = mount(EvDropdownList, {
      props: { searchable: true, searchValue: 'ma', searchPlaceholder: 'Cari vendor' },
    })
    const input = wrapper.find('.ev-dropdown-list__search-input')
    expect((input.element as HTMLInputElement).value).toBe('ma')
    expect(input.attributes('placeholder')).toBe('Cari vendor')

    await input.setValue('maju')
    expect(wrapper.emitted('update:searchValue')).toEqual([['maju']])
  })

  it('caps the height only when scroll is turned on', () => {
    expect(mount(EvDropdownList).find('.ev-dropdown-list__options--scrollable').exists()).toBe(
      false,
    )
    expect(
      mount(EvDropdownList, { props: { scrollable: true } })
        .find('.ev-dropdown-list__options--scrollable')
        .exists(),
    ).toBe(true)
  })

  it('renders the empty state only when filled', () => {
    expect(mount(EvDropdownList).find('.ev-dropdown-list__empty').exists()).toBe(false)
    const wrapper = mount(EvDropdownList, { slots: { empty: 'Tidak ditemukan' } })
    expect(wrapper.find('.ev-dropdown-list__empty').text()).toBe('Tidak ditemukan')
  })

  it('holds its options', () => {
    const wrapper = mount(EvDropdownList, {
      slots: {
        default: () => [h(EvDropdownItem, { label: 'A' }), h(EvDropdownItem, { label: 'B' })],
      },
    })
    expect(wrapper.findAll('[role="option"]')).toHaveLength(2)
  })
})

describe('EvDropdownItem', () => {
  it('is a plain option row by default', () => {
    const wrapper = mount(EvDropdownItem, { props: { label: 'PT Maju' } })
    expect(wrapper.attributes('role')).toBe('option')
    expect(wrapper.attributes('aria-selected')).toBe('false')
    expect(wrapper.classes()).toContain('ev-dropdown-item--list')
    expect(wrapper.find('.ev-dropdown-item__label').text()).toBe('PT Maju')
  })

  it('applies the taller list-box row', () => {
    expect(mount(EvDropdownItem, { props: { variant: 'list-box' } }).classes()).toContain(
      'ev-dropdown-item--list-box',
    )
  })

  it('reports the active option', () => {
    const wrapper = mount(EvDropdownItem, { props: { active: true } })
    expect(wrapper.attributes('aria-selected')).toBe('true')
    expect(wrapper.classes()).toContain('ev-dropdown-item--active')
  })

  it('selects on click and on Enter or Space', async () => {
    const wrapper = mount(EvDropdownItem)
    await wrapper.trigger('click')
    await wrapper.trigger('keydown', { key: 'Enter' })
    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('select')).toHaveLength(3)
  })

  it('is inert and untabbable while disabled', async () => {
    const wrapper = mount(EvDropdownItem, { props: { disabled: true } })
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('tabindex')).toBe('-1')

    await wrapper.trigger('click')
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('renders both slot positions', () => {
    const wrapper = mount(EvDropdownItem, {
      slots: { iconLeft: '<i class="l" />', iconRight: '<i class="r" />' },
    })
    expect(wrapper.find('i.l').exists()).toBe(true)
    expect(wrapper.find('i.r').exists()).toBe(true)
  })
})
