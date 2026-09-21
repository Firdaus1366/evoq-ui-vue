import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputSingleOptions from './EvInputSingleOptions.vue'
import EvRadio from '../../atoms/radio/EvRadio.vue'

const options = [
  { label: 'A', value: 'a' },
  { label: 'B', value: 'b' },
  { label: 'C', value: 'c' },
]

describe('EvInputSingleOptions', () => {
  it('draws one radio per option, exactly one selected', () => {
    const wrapper = mount(EvInputSingleOptions, { props: { options, modelValue: 'b' } })
    const radios = wrapper.findAllComponents(EvRadio)
    expect(radios).toHaveLength(3)
    expect(radios.map((r) => (r.find('input').element as HTMLInputElement).checked)).toEqual([
      false,
      true,
      false,
    ])
  })

  it('replaces the selection rather than adding to it', async () => {
    const wrapper = mount(EvInputSingleOptions, { props: { options, modelValue: 'a' } })
    await wrapper.findAllComponents(EvRadio)[2]?.find('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['c'])
  })

  it('carries the error state to every radio', () => {
    const wrapper = mount(EvInputSingleOptions, { props: { options, error: true } })
    expect(wrapper.findAll('.ev-radio--error').length).toBe(3)
  })
})
