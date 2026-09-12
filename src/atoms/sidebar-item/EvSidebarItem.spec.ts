import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvSidebarItem from './EvSidebarItem.vue'
import type { SidebarItemType } from '../../types'

const CONTROLS: SidebarItemType[] = ['main', 'submenu', 'sub-submenu']

describe('EvSidebarItem', () => {
  it('is a main-level button by default', () => {
    const wrapper = mount(EvSidebarItem, { props: { label: 'Dashboard' } })
    const item = wrapper.find('.ev-sidebar-item')
    expect(item.element.tagName).toBe('BUTTON')
    expect(item.classes()).toContain('ev-sidebar-item--main')
    expect(wrapper.find('.ev-sidebar-item__label').text()).toBe('Dashboard')
  })

  it.each(CONTROLS)('applies the %s type class', (type) => {
    const wrapper = mount(EvSidebarItem, { props: { type } })
    expect(wrapper.find('.ev-sidebar-item').classes()).toContain(`ev-sidebar-item--${type}`)
  })

  // Submenu and Sub Submenu draw an 8px bullet where Main draws a 16px icon.
  it('draws a bullet on the two submenu types and an icon on main', () => {
    const main = mount(EvSidebarItem, { props: { type: 'main' } })
    expect(main.find('.ev-sidebar-item__icon').exists()).toBe(true)
    expect(main.find('.ev-sidebar-item__bullet').exists()).toBe(false)

    for (const type of ['submenu', 'sub-submenu'] as const) {
      const wrapper = mount(EvSidebarItem, { props: { type } })
      expect(wrapper.find('.ev-sidebar-item__bullet').exists()).toBe(true)
      expect(wrapper.find('.ev-sidebar-item__dot').exists()).toBe(true)
      expect(wrapper.find('.ev-sidebar-item__icon').exists()).toBe(false)
    }
  })

  // Board order: leading marker, Label, trailing glyph.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvSidebarItem, {
      props: { label: 'Model' },
      slots: { trailing: '<i />' },
    })
    const parts = Array.from(wrapper.find('.ev-sidebar-item').element.children).map(
      (el) => el.className,
    )
    expect(parts).toEqual([
      'ev-sidebar-item__icon',
      'ev-sidebar-item__label',
      'ev-sidebar-item__trailing',
    ])
  })

  it('marks the current section', () => {
    const wrapper = mount(EvSidebarItem, { props: { active: true } })
    const item = wrapper.find('.ev-sidebar-item')
    expect(item.classes()).toContain('ev-sidebar-item--active')
    expect(item.attributes('aria-current')).toBe('page')
  })

  it('drops the label and trailing glyph when collapsed', () => {
    const wrapper = mount(EvSidebarItem, {
      props: { collapsed: true, label: 'Dashboard' },
      slots: { trailing: '<i />' },
    })
    expect(wrapper.find('.ev-sidebar-item__label').exists()).toBe(false)
    expect(wrapper.find('.ev-sidebar-item__trailing').exists()).toBe(false)
    // The name has to survive, so it moves to the tooltip.
    expect(wrapper.find('.ev-sidebar-item').attributes('title')).toBe('Dashboard')
  })

  it('renders sub-title as a label, not a control', () => {
    const wrapper = mount(EvSidebarItem, { props: { type: 'sub-title', label: 'USER' } })
    expect(wrapper.element.tagName).toBe('LI')
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.find('.ev-sidebar-item__icon').exists()).toBe(false)
    expect(wrapper.text()).toBe('USER')
  })

  it('renders divider as a rule', () => {
    const wrapper = mount(EvSidebarItem, { props: { type: 'divider' } })
    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.find('.ev-sidebar-item__rule').exists()).toBe(true)
    expect(wrapper.find('.ev-sidebar-item__label').exists()).toBe(false)
  })

  it('blocks a disabled item', async () => {
    const wrapper = mount(EvSidebarItem, { props: { disabled: true } })
    await wrapper.find('.ev-sidebar-item').trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('emits click when pressed', async () => {
    const wrapper = mount(EvSidebarItem)
    await wrapper.find('.ev-sidebar-item').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
