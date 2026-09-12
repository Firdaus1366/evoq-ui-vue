import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCommandItem from './EvCommandItem.vue'

describe('EvCommandItem', () => {
  it('is an option button by default', () => {
    const wrapper = mount(EvCommandItem, { props: { label: 'Buka file' } })
    const item = wrapper.find('.ev-command-item')
    expect(item.element.tagName).toBe('BUTTON')
    expect(item.attributes('role')).toBe('option')
    expect(item.attributes('aria-selected')).toBe('false')
    expect(wrapper.find('.ev-command-item__label').text()).toBe('Buka file')
  })

  // Board order: L Icon, Label, Slot (Kbd), trailing glyph.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvCommandItem, {
      props: { label: 'Buka', hasChevron: true },
      slots: { icon: '<i />', kbd: '<kbd>K</kbd>' },
    })
    const parts = Array.from(wrapper.find('.ev-command-item').element.children).map(
      (el) => el.className,
    )
    expect(parts).toEqual([
      'ev-command-item__icon',
      'ev-command-item__label',
      'ev-command-item__kbd',
      'ev-command-item__chevron',
    ])
  })

  // Active swaps the chevron for a check - the board draws one or the other.
  it('swaps the chevron for a check when active', () => {
    const wrapper = mount(EvCommandItem, { props: { active: true, hasChevron: true } })
    expect(wrapper.find('.ev-command-item__check').exists()).toBe(true)
    expect(wrapper.find('.ev-command-item__chevron').exists()).toBe(false)
    expect(wrapper.find('.ev-command-item').attributes('aria-selected')).toBe('true')
  })

  it('renders a heading as an inert div', () => {
    const wrapper = mount(EvCommandItem, { props: { heading: true, label: 'Saran' } })
    const item = wrapper.find('.ev-command-item')
    expect(item.element.tagName).toBe('DIV')
    expect(item.attributes('role')).toBe('presentation')
    expect(item.attributes('aria-selected')).toBeUndefined()
  })

  it('does not emit from a heading', async () => {
    const wrapper = mount(EvCommandItem, { props: { heading: true } })
    await wrapper.find('.ev-command-item').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('blocks a disabled row', async () => {
    const wrapper = mount(EvCommandItem, { props: { disabled: true } })
    await wrapper.find('.ev-command-item').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.find('.ev-command-item').classes()).toContain('ev-command-item--disabled')
  })

  it('renders a real link when given an href', () => {
    const wrapper = mount(EvCommandItem, { props: { href: '/x' } })
    expect(wrapper.find('.ev-command-item').element.tagName).toBe('A')
  })

  it('emits click when pressed', async () => {
    const wrapper = mount(EvCommandItem)
    await wrapper.find('.ev-command-item').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
