import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTree from './EvTree.vue'
import EvTreeItem from './EvTreeItem.vue'

describe('EvTree', () => {
  it('is a labelled tree', () => {
    const wrapper = mount(EvTree, { props: { label: 'Struktur' } })
    expect(wrapper.attributes('role')).toBe('tree')
    expect(wrapper.attributes('aria-label')).toBe('Struktur')
  })
})

describe('EvTreeItem', () => {
  it('is a level 1 treeitem by default', () => {
    const wrapper = mount(EvTreeItem, { props: { label: 'Akar' } })
    expect(wrapper.attributes('role')).toBe('treeitem')
    expect(wrapper.attributes('aria-level')).toBe('1')
    expect(wrapper.classes()).toContain('ev-tree-item--lv1')
    expect(wrapper.find('.ev-tree-item__label').text()).toBe('Akar')
  })

  it('has a chevron by default, matching the board`s Has Child', () => {
    const wrapper = mount(EvTreeItem)
    expect(wrapper.find('.ev-tree-item__chevron').exists()).toBe(true)
    expect(wrapper.attributes('aria-expanded')).toBe('false')
  })

  it('drops the chevron for a leaf, keeping the row aligned', () => {
    const wrapper = mount(EvTreeItem, { props: { hasChild: false } })
    expect(wrapper.find('.ev-tree-item__chevron').exists()).toBe(false)
    expect(wrapper.find('.ev-tree-item__chevron-spacer').exists()).toBe(true)
    expect(wrapper.attributes('aria-expanded')).toBeUndefined()
  })

  it.each([
    [1, '4px'],
    [2, '28px'],
    [3, '52px'],
    [5, '100px'],
    [8, '172px'],
  ])('indents level %i by %s', (level, indent) => {
    const wrapper = mount(EvTreeItem, { props: { level } })
    expect(wrapper.attributes('style')).toContain(`padding-left: ${indent}`)
  })

  it('clamps beyond the eight levels the design system draws', () => {
    const deep = mount(EvTreeItem, { props: { level: 12 } })
    expect(deep.classes()).toContain('ev-tree-item--lv8')
    expect(deep.attributes('aria-level')).toBe('8')

    const shallow = mount(EvTreeItem, { props: { level: 0 } })
    expect(shallow.classes()).toContain('ev-tree-item--lv1')
  })

  it('toggles expansion from the chevron without selecting the row', async () => {
    const wrapper = mount(EvTreeItem)
    await wrapper.find('.ev-tree-item__chevron').trigger('click')
    expect(wrapper.emitted('update:expanded')).toEqual([[true]])
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('selects when the row itself is clicked', async () => {
    const wrapper = mount(EvTreeItem)
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
  })

  it('is reachable and operable from the keyboard', async () => {
    const wrapper = mount(EvTreeItem)
    expect(wrapper.attributes('tabindex')).toBe('0')

    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('select')).toHaveLength(1)

    await wrapper.trigger('keydown', { key: ' ' })
    expect(wrapper.emitted('select')).toHaveLength(2)
  })

  it('opens and closes with the horizontal arrows', async () => {
    const collapsed = mount(EvTreeItem)
    await collapsed.trigger('keydown', { key: 'ArrowRight' })
    expect(collapsed.emitted('update:expanded')).toEqual([[true]])

    const open = mount(EvTreeItem, { props: { expanded: true } })
    await open.trigger('keydown', { key: 'ArrowLeft' })
    expect(open.emitted('update:expanded')).toEqual([[false]])
  })

  it('ignores the arrows on a leaf', async () => {
    const wrapper = mount(EvTreeItem, { props: { hasChild: false } })
    await wrapper.trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('update:expanded')).toBeUndefined()
  })

  it('reflects selection', () => {
    const wrapper = mount(EvTreeItem, { props: { selected: true } })
    expect(wrapper.classes()).toContain('ev-tree-item--selected')
    expect(wrapper.attributes('aria-selected')).toBe('true')
  })

  it('has no checkbox unless asked for one', () => {
    expect(mount(EvTreeItem).find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('renders a labelled checkbox and reports its changes', async () => {
    const wrapper = mount(EvTreeItem, {
      props: { hasCheckbox: true, checkboxLabel: 'Pilih Divisi' },
    })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.attributes('aria-label')).toBe('Pilih Divisi')

    ;(input.element as HTMLInputElement).checked = true
    await input.trigger('change')
    expect(wrapper.emitted('update:checked')).toEqual([[true]])
  })

  it('does not select the row when the checkbox is clicked', async () => {
    const wrapper = mount(EvTreeItem, { props: { hasCheckbox: true } })
    await wrapper.find('.ev-tree-item__checkbox').trigger('click')
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('passes indeterminate through to the checkbox', () => {
    const wrapper = mount(EvTreeItem, { props: { hasCheckbox: true, indeterminate: true } })
    const input = wrapper.find('input[type="checkbox"]').element as HTMLInputElement
    expect(input.indeterminate).toBe(true)
  })

  it('renders the icon and actions slots only when filled', () => {
    const bare = mount(EvTreeItem)
    expect(bare.find('.ev-tree-item__icon').exists()).toBe(false)
    expect(bare.find('.ev-tree-item__actions').exists()).toBe(false)

    const full = mount(EvTreeItem, {
      slots: { icon: '<svg class="i" />', actions: '<button>...</button>' },
    })
    expect(full.find('.ev-tree-item__icon svg.i').exists()).toBe(true)
    expect(full.find('.ev-tree-item__actions button').exists()).toBe(true)
  })
})
