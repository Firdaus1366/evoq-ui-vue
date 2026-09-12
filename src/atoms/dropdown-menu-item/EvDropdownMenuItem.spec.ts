import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvDropdownMenuItem from './EvDropdownMenuItem.vue'

describe('EvDropdownMenuItem', () => {
  it('is a menuitem button by default', () => {
    const wrapper = mount(EvDropdownMenuItem, { props: { label: 'Salin' } })
    const item = wrapper.find('.ev-dropdown-menu-item')
    expect(item.element.tagName).toBe('BUTTON')
    expect(item.attributes('role')).toBe('menuitem')
    expect(item.attributes('type')).toBe('button')
    expect(wrapper.find('.ev-dropdown-menu-item__label').text()).toBe('Salin')
  })

  it('renders a real link when given an href', () => {
    const wrapper = mount(EvDropdownMenuItem, { props: { href: '/x' } })
    const item = wrapper.find('.ev-dropdown-menu-item')
    expect(item.element.tagName).toBe('A')
    expect(item.attributes('href')).toBe('/x')
  })

  // Board order: L Icon, Text, Slot (Kbd), chevron_right.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvDropdownMenuItem, {
      props: { label: 'Salin', subtext: 'Ctrl C', hasChevron: true },
      slots: { icon: '<i />', kbd: '<kbd>C</kbd>' },
    })
    const parts = Array.from(wrapper.find('.ev-dropdown-menu-item').element.children).map(
      (el) => el.className,
    )
    expect(parts).toEqual([
      'ev-dropdown-menu-item__icon',
      'ev-dropdown-menu-item__text',
      'ev-dropdown-menu-item__kbd',
      'ev-dropdown-menu-item__chevron',
    ])
  })

  it('draws optional parts only when they are filled', () => {
    const wrapper = mount(EvDropdownMenuItem, { props: { label: 'Salin' } })
    expect(wrapper.find('.ev-dropdown-menu-item__icon').exists()).toBe(false)
    expect(wrapper.find('.ev-dropdown-menu-item__kbd').exists()).toBe(false)
    expect(wrapper.find('.ev-dropdown-menu-item__chevron').exists()).toBe(false)
    expect(wrapper.find('.ev-dropdown-menu-item__subtext').exists()).toBe(false)
  })

  it('marks the error state without changing the element', () => {
    const wrapper = mount(EvDropdownMenuItem, { props: { error: true } })
    const item = wrapper.find('.ev-dropdown-menu-item')
    expect(item.classes()).toContain('ev-dropdown-menu-item--error')
    expect(item.element.tagName).toBe('BUTTON')
  })

  it('blocks a disabled item, on both elements', async () => {
    const button = mount(EvDropdownMenuItem, { props: { disabled: true } })
    await button.find('.ev-dropdown-menu-item').trigger('click')
    expect(button.emitted('click')).toBeUndefined()
    expect(button.find('button').attributes('disabled')).toBeDefined()

    // A disabled anchor keeps its href off, so it cannot be followed.
    const link = mount(EvDropdownMenuItem, { props: { disabled: true, href: '/x' } })
    expect(link.find('a').attributes('href')).toBeUndefined()
    expect(link.find('a').attributes('aria-disabled')).toBe('true')
  })

  // State=Submenu is a muted heading, not a control.
  it('renders the submenu state as a label, not a button', () => {
    const wrapper = mount(EvDropdownMenuItem, { props: { submenu: true, label: 'Aksi' } })
    expect(wrapper.element.tagName).toBe('LI')
    expect(wrapper.classes()).toContain('ev-dropdown-menu-item--submenu')
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('.ev-dropdown-menu-item__text').exists()).toBe(false)
  })

  it('renders the separator state as a rule', () => {
    const wrapper = mount(EvDropdownMenuItem, { props: { separator: true } })
    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.find('.ev-dropdown-menu-item__rule').exists()).toBe(true)
    expect(wrapper.find('.ev-dropdown-menu-item__label').exists()).toBe(false)
  })

  it('emits click when pressed', async () => {
    const wrapper = mount(EvDropdownMenuItem)
    await wrapper.find('.ev-dropdown-menu-item').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
