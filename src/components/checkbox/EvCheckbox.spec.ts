import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCheckbox from './EvCheckbox.vue'

describe('EvCheckbox', () => {
  it('renders an unchecked native checkbox by default', () => {
    const wrapper = mount(EvCheckbox)
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.classes()).toContain('ev-checkbox--unchecked')
  })

  it('emits update:modelValue on change', async () => {
    const wrapper = mount(EvCheckbox)
    const input = wrapper.find('input')
    ;(input.element as HTMLInputElement).checked = true
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('renders the tick when checked', () => {
    const wrapper = mount(EvCheckbox, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('ev-checkbox--checked')
    expect(wrapper.find('.ev-checkbox__mark').exists()).toBe(true)
  })

  it('sets the DOM indeterminate property, which has no attribute', () => {
    const wrapper = mount(EvCheckbox, { props: { indeterminate: true } })
    expect(wrapper.classes()).toContain('ev-checkbox--indeterminate')
    expect((wrapper.find('input').element as HTMLInputElement).indeterminate).toBe(true)
  })

  it('prefers indeterminate over checked, as the DOM does', () => {
    const wrapper = mount(EvCheckbox, { props: { modelValue: true, indeterminate: true } })
    expect(wrapper.classes()).toContain('ev-checkbox--indeterminate')
    expect(wrapper.classes()).not.toContain('ev-checkbox--checked')
  })

  it('disables the native input', () => {
    const wrapper = mount(EvCheckbox, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ev-checkbox--disabled')
  })

  it('marks the input invalid in the error state', () => {
    const wrapper = mount(EvCheckbox, { props: { error: true } })
    expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    expect(wrapper.classes()).toContain('ev-checkbox--error')
  })

  it('renders label and subtext from props or slots', () => {
    const fromProps = mount(EvCheckbox, { props: { label: 'Setuju', subtext: 'Wajib' } })
    expect(fromProps.find('.ev-checkbox__label').text()).toBe('Setuju')
    expect(fromProps.find('.ev-checkbox__subtext').text()).toBe('Wajib')

    const fromSlots = mount(EvCheckbox, { slots: { default: 'A', subtext: 'B' } })
    expect(fromSlots.find('.ev-checkbox__label').text()).toBe('A')
    expect(fromSlots.find('.ev-checkbox__subtext').text()).toBe('B')
  })

  it('omits the text block entirely when there is nothing to show', () => {
    expect(mount(EvCheckbox).find('.ev-checkbox__text').exists()).toBe(false)
  })
})
