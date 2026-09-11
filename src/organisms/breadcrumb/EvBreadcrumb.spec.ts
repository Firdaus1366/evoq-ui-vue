import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvButtonLink from '../../atoms/button-link/EvButtonLink.vue'
import EvDropdownList from '../../molecules/dropdown-list/EvDropdownList.vue'
import EvBreadcrumb from './EvBreadcrumb.vue'
import type { BreadcrumbItem } from '../../types'

const trail: BreadcrumbItem[] = [
  { label: 'Beranda', href: '/', icon: true },
  { label: 'Pengadaan', href: '/pengadaan' },
  { label: 'Vendor', href: '/pengadaan/vendor' },
  { label: 'PT Maju', href: '/pengadaan/vendor/1' },
  { label: 'Detail' },
]

describe('EvBreadcrumb', () => {
  it('renders one item per crumb', () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail } })
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb')
    expect(wrapper.findAll('.ev-breadcrumb__item')).toHaveLength(5)
  })

  it('marks the last crumb as the current page and does not link it', () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail } })
    const links = wrapper.findAll('.ev-breadcrumb__link')
    const last = links[links.length - 1]!
    expect(last.attributes('aria-current')).toBe('page')
    expect(last.element.tagName).toBe('SPAN')
    expect(links[0]!.element.tagName).toBe('A')
  })

  it('draws one fewer separator than it has crumbs', () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail } })
    expect(wrapper.findAll('.ev-breadcrumb__separator')).toHaveLength(4)
  })

  it('shows the home icon instead of the label when asked', () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail } })
    expect(wrapper.find('.ev-breadcrumb__icon').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Beranda')
  })

  it('emits select with the right index, even for duplicate labels', async () => {
    const dupes: BreadcrumbItem[] = [
      { label: 'Sama', href: '/a' },
      { label: 'Sama', href: '/b' },
      { label: 'Akhir' },
    ]
    const wrapper = mount(EvBreadcrumb, { props: { items: dupes } })
    await wrapper.findAll('.ev-breadcrumb__link')[1]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[dupes[1], 1]])
  })

  it('does not emit select for the current page', async () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail } })
    const links = wrapper.findAll('.ev-breadcrumb__link')
    await links[links.length - 1]!.trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('collapses the middle past maxItems, revealing a dropdown of ancestors on click', async () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail, maxItems: 3 } })
    expect(wrapper.findAll('.ev-breadcrumb__item')).toHaveLength(3)
    const ellipsis = wrapper.find('.ev-breadcrumb__ellipsis')
    expect(ellipsis.attributes('aria-label')).toContain('3')

    expect(wrapper.find('.ev-breadcrumb__dropdown').exists()).toBe(false)
    await ellipsis.trigger('click')
    expect(wrapper.find('.ev-breadcrumb__dropdown').exists()).toBe(true)

    const dropdownItems = wrapper.findAll('.ev-breadcrumb__dropdown-item')
    expect(dropdownItems).toHaveLength(3)
    expect(dropdownItems[0]!.text()).toBe('Pengadaan')
    expect(dropdownItems[1]!.text()).toBe('Vendor')
    expect(dropdownItems[2]!.text()).toBe('PT Maju')

    await dropdownItems[1]!.trigger('click')
    expect(wrapper.emitted('select')).toEqual([[trail[2], 2]])
    expect(wrapper.find('.ev-breadcrumb__dropdown').exists()).toBe(false)
  })

  it('composes ButtonLink crumbs: Secondary, with the page you are on pinned Active', () => {
    const links = mount(EvBreadcrumb, { props: { items: trail } }).findAllComponents(EvButtonLink)
    expect(links).toHaveLength(5)
    expect(links.every((l) => l.props('variant') === 'secondary')).toBe(true)
    expect(links.map((l) => l.props('current'))).toEqual([false, false, false, false, true])
  })

  it('names the icon-only home crumb by its label', () => {
    const home = mount(EvBreadcrumb, { props: { items: trail } }).findAll(
      '.ev-breadcrumb__link',
    )[0]!
    expect(home.attributes('aria-label')).toBe('Beranda')
  })

  it('opens the DropdownList molecule as a menu of real links', async () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail, maxItems: 3 } })
    await wrapper.find('.ev-breadcrumb__ellipsis').trigger('click')

    const list = wrapper.findComponent(EvDropdownList)
    expect(list.props('menu')).toBe(true)
    const anchors = wrapper.findAll('.ev-breadcrumb__dropdown-item a')
    expect(anchors.map((a) => a.attributes('href'))).toEqual([
      '/pengadaan',
      '/pengadaan/vendor',
      '/pengadaan/vendor/1',
    ])
    expect(anchors.every((a) => a.attributes('role') === 'menuitem')).toBe(true)
  })

  it('never collapses when maxItems is 0', () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: trail, maxItems: 0 } })
    expect(wrapper.find('.ev-breadcrumb__ellipsis').exists()).toBe(false)
  })

  it('renders nothing but the list when there are no items', () => {
    const wrapper = mount(EvBreadcrumb, { props: { items: [] } })
    expect(wrapper.findAll('.ev-breadcrumb__item')).toHaveLength(0)
  })
})
