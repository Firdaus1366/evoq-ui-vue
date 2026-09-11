import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputFieldUnit from './EvInputFieldUnit.vue'

describe('EvInputFieldUnit', () => {
  it('renders unit select dropdown and input control', () => {
    const wrapper = mount(EvInputFieldUnit, {
      props: {
        unit: 'USD',
        units: ['IDR', 'USD', 'EUR'],
        modelValue: '1500',
        label: 'Harga Barang',
      },
    })

    const select = wrapper.find('select')
    expect(select.exists()).toBe(true)
    expect(select.element.value).toBe('USD')

    const input = wrapper.find('input')
    expect(input.element.value).toBe('1500')
    expect(wrapper.text()).toContain('Harga Barang')
  })

  it('emits update:unit when unit is changed', async () => {
    const wrapper = mount(EvInputFieldUnit, {
      props: {
        unit: 'IDR',
        units: ['IDR', 'USD', 'EUR'],
      },
    })

    const select = wrapper.find('select')
    await select.setValue('EUR')
    expect(wrapper.emitted('update:unit')?.[0]).toEqual(['EUR'])
  })
})
