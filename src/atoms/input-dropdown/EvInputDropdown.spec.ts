import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputDropdown from './EvInputDropdown.vue'

const cls = (el: Element) => el.className.split(' ')[0]

describe('EvInputDropdown', () => {
  it('draws content, then slot, then message, in board order', () => {
    const wrapper = mount(EvInputDropdown, {
      props: { label: 'Title', open: true, error: true, validationText: 'Validation Text' },
      slots: { default: '<ul>options</ul>' },
    })
    const order = Array.from((wrapper.element as Element).children).map(cls)
    expect(order).toEqual([
      'ev-input-dropdown__content',
      'ev-input-dropdown__slot',
      'ev-input-dropdown__message',
    ])
  })

  it('draws the notched Title inside Content, and only when given', () => {
    const on = mount(EvInputDropdown, { props: { label: 'Title', required: true } })
    expect(on.find('.ev-input-dropdown__content .ev-input-dropdown__label').text()).toBe('Title*')
    expect(mount(EvInputDropdown).find('.ev-input-dropdown__label').exists()).toBe(false)
  })

  it('shows the placeholder while empty and the value once filled', async () => {
    const wrapper = mount(EvInputDropdown, { props: { placeholder: 'Select' } })
    const value = () => wrapper.find('.ev-input-dropdown__value')
    expect(value().text()).toBe('Select')
    expect(value().classes()).toContain('ev-input-dropdown__value--placeholder')
    await wrapper.setProps({ modelValue: 'Option A' })
    expect(value().text()).toBe('Option A')
    expect(value().classes()).not.toContain('ev-input-dropdown__value--placeholder')
  })

  it('toggles open on click and emits update:open', async () => {
    const wrapper = mount(EvInputDropdown)
    await wrapper.find('.ev-input-dropdown__content').trigger('click')
    expect(wrapper.emitted('update:open')?.[0]).toEqual([true])
  })

  it('does not open when disabled, and hides the chevron', async () => {
    const wrapper = mount(EvInputDropdown, { props: { disabled: true } })
    await wrapper.find('.ev-input-dropdown__content').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
    expect(wrapper.find('.ev-input-dropdown__glyph').exists()).toBe(false)
  })

  it('offers clear only while open and holding a value', async () => {
    const wrapper = mount(EvInputDropdown, { props: { modelValue: 'A' } })
    expect(wrapper.find('.ev-input-dropdown__clear').exists()).toBe(false)
    await wrapper.setProps({ open: true })
    await wrapper.find('.ev-input-dropdown__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('renders the leading icon slot only when supplied', () => {
    const wrapper = mount(EvInputDropdown, { slots: { iconLeft: '<i class="x" />' } })
    expect(wrapper.find('.ev-input-dropdown__lead .x').exists()).toBe(true)
    expect(mount(EvInputDropdown).find('.ev-input-dropdown__lead').exists()).toBe(false)
  })

  it('maps Size=Small onto a modifier', () => {
    expect(mount(EvInputDropdown, { props: { size: 'small' } }).classes()).toContain(
      'ev-input-dropdown--small',
    )
  })
})
