import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvDropdownItem from '../../atoms/dropdown-item/EvDropdownItem.vue'
import EvInput from '../../atoms/input/EvInput.vue'
import EvInputDropdown from '../../atoms/input-dropdown/EvInputDropdown.vue'
import EvInputFieldUnit from './EvInputFieldUnit.vue'

describe('EvInputFieldUnit', () => {
  it('composes the InputDropdown atom for the unit, as the board instances it', () => {
    const wrapper = mount(EvInputFieldUnit, {
      props: {
        unit: 'USD',
        units: ['IDR', 'USD', 'EUR'],
        modelValue: '1500',
        label: 'Harga Barang',
      },
    })
    const unit = wrapper.findComponent(EvInputDropdown)
    expect(unit.exists()).toBe(true)
    expect(unit.props('modelValue')).toBe('USD')
    expect(wrapper.find('select').exists()).toBe(false)

    expect(wrapper.find('input').element.value).toBe('1500')
    expect(wrapper.text()).toContain('Harga Barang')
  })

  it('draws the row as dropdown then field, in board order', () => {
    const wrapper = mount(EvInputFieldUnit)
    const row = Array.from(wrapper.find('.ev-input-field-unit__field').element.children).map(
      (el) => el.className.split(' ')[0],
    )
    expect(row).toEqual(['ev-input-dropdown', 'ev-input'])
  })

  it('shows the Select placeholder until a unit is chosen (board State=Default)', () => {
    const wrapper = mount(EvInputFieldUnit, {
      props: { units: ['IDR', 'USD'], unitLabel: 'Title' },
    })
    const unit = wrapper.findComponent(EvInputDropdown)
    expect(unit.props('modelValue')).toBe('')
    expect(unit.find('.ev-input-dropdown__value').text()).toBe('Select')
    expect(unit.find('.ev-input-dropdown__label').text()).toBe('Title')
  })

  it('clears the unit from the open dropdown (board State=Active)', async () => {
    const wrapper = mount(EvInputFieldUnit, { props: { unit: 'IDR', units: ['IDR', 'USD'] } })
    await wrapper.find('.ev-input-dropdown__content').trigger('click')
    await wrapper.find('.ev-input-dropdown__clear').trigger('click')
    expect(wrapper.emitted('update:unit')?.[0]).toEqual([''])
  })

  it('emits update:unit when an option is chosen, then closes the list', async () => {
    const wrapper = mount(EvInputFieldUnit, {
      props: { unit: 'IDR', units: ['IDR', 'USD', 'EUR'] },
    })
    await wrapper.find('.ev-input-dropdown__content').trigger('click')
    const rows = wrapper.findAllComponents(EvDropdownItem)
    expect(rows).toHaveLength(3)
    await rows[2]?.trigger('click')
    expect(wrapper.emitted('update:unit')?.[0]).toEqual(['EUR'])
    expect(wrapper.find('.ev-input-dropdown__slot').exists()).toBe(false)
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
