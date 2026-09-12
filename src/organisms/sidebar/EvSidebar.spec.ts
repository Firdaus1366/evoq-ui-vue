import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvSidebar from './EvSidebar.vue'
import EvSidebarItem from '../../atoms/sidebar-item/EvSidebarItem.vue'
import EvButton from '../../atoms/button/EvButton.vue'
import EvInputSearch from '../../atoms/input-search/EvInputSearch.vue'
import EvLogo from '../../atoms/logo/EvLogo.vue'

describe('EvSidebar', () => {
  it('is a labelled complementary region', () => {
    const wrapper = mount(EvSidebar, { props: { label: 'Menu utama' } })
    expect(wrapper.element.tagName).toBe('ASIDE')
    expect(wrapper.attributes('aria-label')).toBe('Menu utama')
  })

  // Board order: logo, search row, navigation, the Slot.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvSidebar, { slots: { footer: '<div />' } })
    const parts = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(parts).toEqual([
      'ev-sidebar__header',
      'ev-sidebar__search',
      'ev-sidebar__nav',
      'ev-sidebar__footer',
    ])
  })

  /*
   * The logo, the search field and the toggle are all instances on the board,
   * so all three have to be composed.
   */
  it('composes the logo, the search field and the toggle', () => {
    const wrapper = mount(EvSidebar)
    expect(wrapper.findComponent(EvLogo).exists()).toBe(true)
    expect(wrapper.findComponent(EvInputSearch).exists()).toBe(true)
    const toggle = wrapper.findComponent(EvButton)
    expect(toggle.props('variant')).toBe('secondary-light')
    expect(toggle.props('iconOnly')).toBe(true)
  })

  // Open=No: the 32px mark, no field, and the small (32x32) toggle.
  it('narrows to the icon rail when collapsed', () => {
    const wrapper = mount(EvSidebar, { props: { collapsed: true } })
    expect(wrapper.classes()).toContain('ev-sidebar--collapsed')
    expect(wrapper.findComponent(EvLogo).props('variant')).toBe('mark')
    expect(wrapper.findComponent(EvLogo).props('size')).toBe(32)
    expect(wrapper.findComponent(EvInputSearch).exists()).toBe(false)
    expect(wrapper.findComponent(EvButton).props('size')).toBe('small')
  })

  it('uses the full lockup and the 40px toggle when open', () => {
    const wrapper = mount(EvSidebar)
    expect(wrapper.findComponent(EvLogo).props('variant')).toBe('lockup')
    expect(wrapper.findComponent(EvButton).props('size')).toBe('default')
  })

  it('emits the collapse state instead of owning it', async () => {
    const wrapper = mount(EvSidebar, { props: { collapsed: false } })
    await wrapper.findComponent(EvButton).trigger('click')
    expect(wrapper.emitted('update:collapsed')).toEqual([[true]])
  })

  it('emits the search value back out', async () => {
    const wrapper = mount(EvSidebar)
    wrapper.findComponent(EvInputSearch).vm.$emit('update:modelValue', 'dash')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:searchValue')).toEqual([['dash']])
  })

  // M - Sidebar puts the toggle in the header and the field on its own row.
  it('moves the toggle into the header on the mobile board', () => {
    const wrapper = mount(EvSidebar, { props: { mobile: true } })
    expect(wrapper.classes()).toContain('ev-sidebar--mobile')
    expect(wrapper.find('.ev-sidebar__header').findComponent(EvButton).exists()).toBe(true)
    expect(wrapper.find('.ev-sidebar__search').findComponent(EvButton).exists()).toBe(false)
  })

  it('lets the header slot replace the logo', () => {
    const wrapper = mount(EvSidebar, { slots: { header: '<div class="account" />' } })
    expect(wrapper.findComponent(EvLogo).exists()).toBe(false)
    expect(wrapper.find('.account').exists()).toBe(true)
  })

  it('holds its navigation rows in a list', () => {
    const wrapper = mount(EvSidebar, {
      slots: { default: '<ev-sidebar-item label="Dashboard" active />' },
      global: { components: { EvSidebarItem } },
    })
    expect(wrapper.find('.ev-sidebar__nav').element.tagName).toBe('UL')
    expect(wrapper.findComponent(EvSidebarItem).exists()).toBe(true)
  })

  it('drops the search row when it is turned off', () => {
    expect(
      mount(EvSidebar, { props: { searchable: false } })
        .find('.ev-sidebar__search')
        .exists(),
    ).toBe(false)
  })
})
