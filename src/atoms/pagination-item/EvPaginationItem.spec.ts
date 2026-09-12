import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvPaginationItem from './EvPaginationItem.vue'

describe('EvPaginationItem', () => {
  it('renders its page number in a button', () => {
    const wrapper = mount(EvPaginationItem, { props: { page: 3 } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('3')
  })

  it('marks the page on screen', () => {
    const wrapper = mount(EvPaginationItem, { props: { page: 1, active: true } })
    expect(wrapper.classes()).toContain('ev-pagination-item--active')
    expect(wrapper.attributes('aria-current')).toBe('page')
  })

  it('does not emit when disabled', async () => {
    const wrapper = mount(EvPaginationItem, { props: { page: 2, disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  // State=More is inert, so it must not be a button.
  it('renders the ellipsis tile as a span with a name', () => {
    const wrapper = mount(EvPaginationItem, { props: { more: true } })
    expect(wrapper.element.tagName).toBe('SPAN')
    expect(wrapper.classes()).toContain('ev-pagination-item--more')
    expect(wrapper.find('.ev-pagination-item__sr').text()).toBe('Halaman lainnya')
    expect(wrapper.attributes('aria-current')).toBeUndefined()
  })

  it('draws three dots in the ellipsis tile', () => {
    expect(mount(EvPaginationItem, { props: { more: true } }).findAll('circle')).toHaveLength(3)
  })

  it('emits click when pressed', async () => {
    const wrapper = mount(EvPaginationItem, { props: { page: 4 } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
