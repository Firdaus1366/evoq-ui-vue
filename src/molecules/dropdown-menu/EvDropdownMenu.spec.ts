import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvDropdownMenu from './EvDropdownMenu.vue'
import EvDropdownMenuItem from '../../atoms/dropdown-menu-item/EvDropdownMenuItem.vue'
import EvInputSearch from '../../atoms/input-search/EvInputSearch.vue'

describe('EvDropdownMenu', () => {
  it('is a menu holding its rows', () => {
    const wrapper = mount(EvDropdownMenu, {
      props: { label: 'Aksi' },
      slots: {
        default: ['<li class="a"></li>', '<li class="b"></li>', '<li class="c"></li>'].join(''),
      },
    })
    const list = wrapper.find('.ev-dropdown-menu__content')
    expect(list.element.tagName).toBe('UL')
    expect(list.attributes('role')).toBe('menu')
    expect(list.attributes('aria-label')).toBe('Aksi')
    expect(list.element.children).toHaveLength(3)
  })

  // The board hides the Search frame on every variant.
  it('has no search field until asked for one', () => {
    expect(mount(EvDropdownMenu).find('.ev-dropdown-menu__search').exists()).toBe(false)
    const wrapper = mount(EvDropdownMenu, { props: { searchable: true } })
    expect(wrapper.findComponent(EvInputSearch).exists()).toBe(true)
  })

  it('composes EvInputSearch rather than redrawing it', () => {
    const wrapper = mount(EvDropdownMenu, {
      props: { searchable: true, searchPlaceholder: 'Cari aksi' },
    })
    expect(wrapper.findComponent(EvInputSearch).props('placeholder')).toBe('Cari aksi')
  })

  it('emits the search value back out', async () => {
    const wrapper = mount(EvDropdownMenu, { props: { searchable: true } })
    wrapper.findComponent(EvInputSearch).vm.$emit('update:modelValue', 'sal')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:searchValue')).toEqual([['sal']])
  })

  it('caps the list when given a max height', () => {
    const wrapper = mount(EvDropdownMenu, { props: { maxHeight: 320 } })
    expect(wrapper.find('.ev-dropdown-menu__content').attributes('style')).toContain(
      'max-height: 320px',
    )
  })

  it('renders real dropdown menu items', () => {
    const wrapper = mount(EvDropdownMenu, {
      slots: { default: '<ev-dropdown-menu-item label="Salin" />' },
      global: { components: { EvDropdownMenuItem } },
    })
    expect(wrapper.findComponent(EvDropdownMenuItem).exists()).toBe(true)
    expect(wrapper.find('.ev-dropdown-menu-item__label').text()).toBe('Salin')
  })

  // The board's 2px Scroll rail is hidden on every variant and is not drawn.
  it('draws no scroll rail of its own', () => {
    expect(mount(EvDropdownMenu).find('.ev-dropdown-menu__scroll').exists()).toBe(false)
  })
})
