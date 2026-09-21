import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputMultipleOptions from './EvInputMultipleOptions.vue'
import EvCheckbox from '../../atoms/checkbox/EvCheckbox.vue'

const options = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
]
const cls = (el: Element) => el.className.split(' ')[0]

describe('EvInputMultipleOptions', () => {
  it('draws the Title, then the wrapped checkbox list, then the message', () => {
    const wrapper = mount(EvInputMultipleOptions, {
      props: { label: 'Title', options, validationText: 'Validation Text' },
    })
    expect(Array.from((wrapper.element as Element).children).map(cls)).toEqual([
      'ev-input-multiple-options__title',
      'ev-input-multiple-options__list',
      'ev-input-multiple-options__message',
    ])
    expect(wrapper.findAllComponents(EvCheckbox)).toHaveLength(3)
  })

  it('draws no border or surface of its own', () => {
    const wrapper = mount(EvInputMultipleOptions, { props: { options } })
    expect(wrapper.find('.ev-input-multiple-options__field').exists()).toBe(false)
  })

  it('toggles a value in and out of the selection', async () => {
    const wrapper = mount(EvInputMultipleOptions, { props: { options, modelValue: ['a'] } })
    const boxes = wrapper.findAllComponents(EvCheckbox)
    expect(boxes.map((b) => b.props('modelValue'))).toEqual([true, false, false])
    await boxes[1]?.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']])
    await boxes[0]?.find('input').setValue(false)
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([[]])
  })

  it('pushes error and disabled onto every checkbox', () => {
    const err = mount(EvInputMultipleOptions, { props: { options, error: true } })
    expect(err.findAllComponents(EvCheckbox).every((c) => c.props('error'))).toBe(true)
    const dis = mount(EvInputMultipleOptions, { props: { options, disabled: true } })
    expect(dis.findAllComponents(EvCheckbox).every((c) => c.props('disabled'))).toBe(true)
  })
})
