import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvNavMenuMobileItem from './EvNavMenuMobileItem.vue'

describe('EvNavMenuMobileItem', () => {
  // Board order: Icon, Label - and both are always drawn.
  it('renders the icon above the label', () => {
    const wrapper = mount(EvNavMenuMobileItem, { props: { label: 'Beranda' } })
    const parts = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(parts).toEqual(['ev-nav-menu-mobile-item__icon', 'ev-nav-menu-mobile-item__label'])
    expect(wrapper.find('.ev-nav-menu-mobile-item__label').text()).toBe('Beranda')
  })

  it('is a button until given an href', () => {
    expect(mount(EvNavMenuMobileItem).element.tagName).toBe('BUTTON')
    const link = mount(EvNavMenuMobileItem, { props: { href: '/beranda' } })
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('/beranda')
    expect(link.attributes('type')).toBeUndefined()
  })

  it('marks the current section', () => {
    const wrapper = mount(EvNavMenuMobileItem, { props: { active: true } })
    expect(wrapper.classes()).toContain('ev-nav-menu-mobile-item--active')
    expect(wrapper.attributes('aria-current')).toBe('page')
  })

  it('falls back to a placeholder glyph', () => {
    expect(mount(EvNavMenuMobileItem).find('.ev-nav-menu-mobile-item__icon svg').exists()).toBe(
      true,
    )
  })

  it('emits click when pressed', async () => {
    const wrapper = mount(EvNavMenuMobileItem)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
