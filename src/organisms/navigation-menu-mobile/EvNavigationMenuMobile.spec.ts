import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvNavigationMenuMobile from './EvNavigationMenuMobile.vue'
import EvNavMenuMobileItem from '../../atoms/nav-menu-mobile-item/EvNavMenuMobileItem.vue'

const global = { components: { EvNavMenuMobileItem } }
const items = (n: number) =>
  Array.from({ length: n }, (_, i) => `<ev-nav-menu-mobile-item label="M${i}" />`).join('')

describe('EvNavigationMenuMobile', () => {
  it('is a labelled navigation landmark', () => {
    const wrapper = mount(EvNavigationMenuMobile, { props: { label: 'Navigasi bawah' } })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Navigasi bawah')
  })

  // The board's `Size` property is the item count, so it is not a prop.
  it.each([2, 3, 4, 5])('holds %i items in one row', (count) => {
    const wrapper = mount(EvNavigationMenuMobile, { slots: { default: items(count) }, global })
    expect(wrapper.findAllComponents(EvNavMenuMobileItem)).toHaveLength(count)
    expect(wrapper.find('.ev-navigation-menu-mobile__row').exists()).toBe(true)
  })

  it('draws no centre action until asked for one', () => {
    const wrapper = mount(EvNavigationMenuMobile, { slots: { default: items(4) }, global })
    expect(wrapper.find('.ev-navigation-menu-mobile__action').exists()).toBe(false)
    expect(wrapper.find('.ev-navigation-menu-mobile__space').exists()).toBe(false)
  })

  /*
   * CenterButton: the row splits around a `Space` frame, and the action sits
   * above it. Order matters - the space has to fall between the two slots.
   */
  it('splits the row around the centre action', () => {
    const wrapper = mount(EvNavigationMenuMobile, {
      props: { centerButton: true },
      slots: { default: items(2), after: items(2) },
      global,
    })
    const row = wrapper.find('.ev-navigation-menu-mobile__row')
    const parts = Array.from(row.element.children).map(
      (el) => (el as Element).className.split(' ')[0],
    )
    expect(parts).toEqual([
      'ev-nav-menu-mobile-item',
      'ev-nav-menu-mobile-item',
      'ev-navigation-menu-mobile__space',
      'ev-nav-menu-mobile-item',
      'ev-nav-menu-mobile-item',
      'ev-navigation-menu-mobile__wrapper',
    ])
  })

  it('names and emits from the centre action', async () => {
    const wrapper = mount(EvNavigationMenuMobile, {
      props: { centerButton: true, centerLabel: 'Buat baru' },
    })
    const action = wrapper.find('.ev-navigation-menu-mobile__action')
    expect(action.attributes('aria-label')).toBe('Buat baru')
    expect(action.attributes('type')).toBe('button')
    await action.trigger('click')
    expect(wrapper.emitted('center-click')).toHaveLength(1)
  })

  it('lets the centre glyph be replaced', () => {
    const wrapper = mount(EvNavigationMenuMobile, {
      props: { centerButton: true },
      slots: { center: '<i class="custom" />' },
    })
    expect(wrapper.find('.custom').exists()).toBe(true)
  })

  it('ignores the after slot without a centre action', () => {
    const wrapper = mount(EvNavigationMenuMobile, {
      slots: { default: items(2), after: items(2) },
      global,
    })
    // Both slots still render - the board only adds the Space frame.
    expect(wrapper.findAllComponents(EvNavMenuMobileItem)).toHaveLength(4)
    expect(wrapper.find('.ev-navigation-menu-mobile__space').exists()).toBe(false)
  })
})
