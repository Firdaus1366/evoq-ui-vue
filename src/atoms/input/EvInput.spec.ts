import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInput from './EvInput.vue'

describe('EvInput', () => {
  it('is a text field carrying its value', () => {
    const wrapper = mount(EvInput, { props: { modelValue: 'Halo' } })
    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('text')
    expect((input.element as HTMLInputElement).value).toBe('Halo')
  })

  it('emits on input', async () => {
    const wrapper = mount(EvInput)
    await wrapper.find('input').setValue('Maju')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Maju']])
  })

  it('takes any native type', () => {
    expect(
      mount(EvInput, { props: { type: 'search' } })
        .find('input')
        .attributes('type'),
    ).toBe('search')
  })

  it('wires the label to its own field', () => {
    const wrapper = mount(EvInput, { props: { label: 'Nama' } })
    expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('input').attributes('id'))
  })

  it('marks a required field, and shows the board`s asterisk', () => {
    const wrapper = mount(EvInput, { props: { label: 'Nama', required: true } })
    expect(wrapper.find('input').attributes('required')).toBeDefined()
    expect(wrapper.find('.ev-input__required').text()).toBe('*')
  })

  it('reports the error state and points at the message', () => {
    const wrapper = mount(EvInput, { props: { error: true, validationText: 'Wajib diisi' } })
    const input = wrapper.find('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      wrapper.find('.ev-input__message').attributes('id'),
    )
    expect(wrapper.classes()).toContain('ev-input--error')
  })

  it('swaps the trailing icon for the error glyph when invalid', () => {
    const wrapper = mount(EvInput, {
      props: { error: true },
      slots: { iconRight: '<i class="mine" />' },
    })
    expect(wrapper.find('.ev-input__icon--error').exists()).toBe(true)
    expect(wrapper.find('i.mine').exists()).toBe(false)
  })

  it('shows the clear button only when there is something to clear', async () => {
    expect(
      mount(EvInput, { props: { clearable: true } })
        .find('.ev-input__clear')
        .exists(),
    ).toBe(false)

    const wrapper = mount(EvInput, { props: { clearable: true, modelValue: 'isi' } })
    await wrapper.find('.ev-input__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('hides the clear button while disabled or read-only', () => {
    for (const props of [{ disabled: true }, { readonly: true }]) {
      const wrapper = mount(EvInput, { props: { clearable: true, modelValue: 'x', ...props } })
      expect(wrapper.find('.ev-input__clear').exists()).toBe(false)
    }
  })

  it('renders no message row when there is no message', () => {
    expect(mount(EvInput).find('.ev-input__message').exists()).toBe(false)
  })

  it("keeps a caller's aria-describedby alongside its own message", () => {
    const bare = mount(EvInput, { attrs: { 'aria-describedby': 'hint' } })
    expect(bare.find('input').attributes('aria-describedby')).toBe('hint')

    const both = mount(EvInput, {
      props: { validationText: 'Salah' },
      attrs: { 'aria-describedby': 'hint' },
    })
    const ids = both.find('input').attributes('aria-describedby')!.split(' ')
    expect(ids[0]).toBe('hint')
    expect(ids[1]).toBe(both.find('.ev-input__message').attributes('id'))
  })
})
