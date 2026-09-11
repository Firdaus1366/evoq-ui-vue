import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInput from '../../atoms/input/EvInput.vue'
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

  it('composes the InputField atom for its value box, as the board instances it', () => {
    const wrapper = mount(EvInputFieldUnit, {
      props: { label: 'Harga', required: true, error: true, clearable: true, modelValue: '5' },
    })
    const field = wrapper.findComponent(EvInput)
    expect(field.exists()).toBe(true)
    expect(field.props()).toMatchObject({
      label: 'Harga',
      required: true,
      error: true,
      clearable: true,
      modelValue: '5',
    })
    // The field atom does not carry the message - the board runs one under both boxes.
    expect(field.props('validationText')).toBeUndefined()
  })

  it('points the field at the shared message below both boxes', () => {
    const wrapper = mount(EvInputFieldUnit, { props: { validationText: 'Wajib diisi' } })
    const message = wrapper.find('.ev-input-field-unit__message')
    expect(message.text()).toBe('Wajib diisi')
    expect(wrapper.find('input').attributes('aria-describedby')).toBe(message.attributes('id'))
  })

  it('passes value edits and clearing straight through', async () => {
    const wrapper = mount(EvInputFieldUnit, { props: { modelValue: '9', clearable: true } })
    await wrapper.find('input').setValue('12')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['12'])

    await wrapper.find('.ev-input__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([''])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })
})
