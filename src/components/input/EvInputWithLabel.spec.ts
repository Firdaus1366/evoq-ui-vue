import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputWithLabel from './EvInputWithLabel.vue'

describe('EvInputWithLabel', () => {
  it('renders prefix and suffix addons correctly', () => {
    const wrapper = mount(EvInputWithLabel, {
      props: {
        prefixLabel: 'https://',
        suffixLabel: '.com',
        placement: 'both',
        modelValue: 'mywebsite',
      },
    })

    expect(wrapper.text()).toContain('https://')
    expect(wrapper.text()).toContain('.com')
    const input = wrapper.find('input')
    expect(input.element.value).toBe('mywebsite')
  })

  it('renders left addon only on placement left', () => {
    const wrapper = mount(EvInputWithLabel, {
      props: {
        prefixLabel: 'Rp',
        placement: 'left',
      },
    })

    expect(wrapper.find('.ev-input-with-label__addon--left').exists()).toBe(true)
    expect(wrapper.find('.ev-input-with-label__addon--right').exists()).toBe(false)
  })

  it('handles validation error state', () => {
    const wrapper = mount(EvInputWithLabel, {
      props: {
        error: true,
        validationText: 'Domain tidak valid',
      },
    })

    expect(wrapper.classes()).toContain('ev-input-with-label--error')
    expect(wrapper.text()).toContain('Domain tidak valid')
  })
})
