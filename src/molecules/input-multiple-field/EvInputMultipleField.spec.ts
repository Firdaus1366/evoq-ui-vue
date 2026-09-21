import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputMultipleField from './EvInputMultipleField.vue'
import EvTag from '../../atoms/tag/EvTag.vue'

const options = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
]
const cls = (el: Element) => el.className.split(' ')[0]

describe('EvInputMultipleField', () => {
  it('draws the Title alone while empty, with no notched label', () => {
    const wrapper = mount(EvInputMultipleField, { props: { label: 'Title' } })
    expect(wrapper.find('.ev-input-multiple-field__title').text()).toBe('Title')
    expect(wrapper.find('.ev-input-multiple-field__label').exists()).toBe(false)
    expect(wrapper.findAllComponents(EvTag)).toHaveLength(0)
  })

  it('draws the placeholder line then one outline tag per value', () => {
    const wrapper = mount(EvInputMultipleField, {
      props: { modelValue: ['a', 'b'], options, placeholder: 'Placeholder' },
    })
    const body = wrapper.find('.ev-input-multiple-field__body')
    expect(Array.from(body.element.children).map(cls)).toEqual([
      'ev-input-multiple-field__placeholder',
      'ev-input-multiple-field__selection',
    ])
    const tags = wrapper.findAllComponents(EvTag)
    expect(tags.map((t) => t.text())).toEqual(['A', 'B'])
    expect(tags.every((t) => t.classes().includes('ev-tag--outline'))).toBe(true)
  })

  it('makes tags removable only while open, and removes by value', async () => {
    const wrapper = mount(EvInputMultipleField, { props: { modelValue: ['a', 'b'], options } })
    expect(wrapper.find('.ev-tag__remove').exists()).toBe(false)
    await wrapper.setProps({ open: true })
    await wrapper.findAll('.ev-tag__remove')[0]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['b']])
  })

  it('has no chevron when disabled and does not open', async () => {
    const wrapper = mount(EvInputMultipleField, { props: { disabled: true } })
    expect(wrapper.find('.ev-input-multiple-field__icon').exists()).toBe(false)
    await wrapper.find('.ev-input-multiple-field__content').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})
