import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvSlider from './EvSlider.vue'

describe('EvSlider', () => {
  it('is a horizontal primary slider by default', () => {
    const wrapper = mount(EvSlider, { props: { label: 'Volume' } })
    expect(wrapper.classes()).toContain('ev-slider--horizontal')
    expect(wrapper.classes()).toContain('ev-slider--primary')
    expect(wrapper.findAll('input[type="range"]')).toHaveLength(1)
  })

  it('rides on a native range input, so keyboard support is the platform`s', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 40, min: 0, max: 200, step: 5 } })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('200')
    expect(input.attributes('step')).toBe('5')
    expect((input.element as HTMLInputElement).value).toBe('40')
  })

  it('fills from the start of the track to the handle', () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 25, min: 0, max: 100 } })
    const style = wrapper.find('.ev-slider__fill').attributes('style')!
    expect(style).toContain('left: 0%')
    expect(style).toContain('width: 25%')
  })

  it('emits a plain number in single mode', async () => {
    const wrapper = mount(EvSlider, { props: { modelValue: 10 } })
    const input = wrapper.find('input')
    ;(input.element as HTMLInputElement).value = '60'
    await input.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toEqual([[60]])
  })

  it('grows a second handle in range mode', () => {
    const wrapper = mount(EvSlider, { props: { range: true, modelValue: [20, 80] } })
    expect(wrapper.findAll('input[type="range"]')).toHaveLength(2)
    expect(wrapper.classes()).toContain('ev-slider--range')
  })

  it('fills between the two handles in range mode', () => {
    const wrapper = mount(EvSlider, { props: { range: true, modelValue: [20, 80] } })
    const style = wrapper.find('.ev-slider__fill').attributes('style')!
    expect(style).toContain('left: 20%')
    expect(style).toContain('width: 60%')
  })

  it('emits a pair in range mode', async () => {
    const wrapper = mount(EvSlider, { props: { range: true, modelValue: [20, 80] } })
    const upper = wrapper.findAll('input')[1]!
    ;(upper.element as HTMLInputElement).value = '90'
    await upper.trigger('input')
    expect(wrapper.emitted('update:modelValue')).toEqual([[[20, 90]]])
  })

  it('stops the handles crossing each other', async () => {
    const wrapper = mount(EvSlider, { props: { range: true, modelValue: [20, 80] } })
    const lower = wrapper.findAll('input')[0]!
    ;(lower.element as HTMLInputElement).value = '95'
    await lower.trigger('input')
    // Clamped to the upper handle rather than jumping past it.
    expect(wrapper.emitted('update:modelValue')).toEqual([[[80, 80]]])
  })

  it('labels each handle distinctly in range mode', () => {
    const wrapper = mount(EvSlider, { props: { range: true, modelValue: [1, 2], label: 'Harga' } })
    const inputs = wrapper.findAll('input')
    expect(inputs[0]!.attributes('aria-label')).toContain('bawah')
    expect(inputs[1]!.attributes('aria-label')).toContain('atas')
  })

  it('fills along the other axis when vertical', () => {
    const wrapper = mount(EvSlider, { props: { orientation: 'vertical', modelValue: 30 } })
    expect(wrapper.classes()).toContain('ev-slider--vertical')
    const style = wrapper.find('.ev-slider__fill').attributes('style')!
    expect(style).toContain('bottom: 0%')
    expect(style).toContain('height: 30%')
  })

  it('disables the underlying input', () => {
    const wrapper = mount(EvSlider, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ev-slider--disabled')
  })

  it('shows the value only when asked', () => {
    expect(mount(EvSlider).find('.ev-slider__values').exists()).toBe(false)
    const wrapper = mount(EvSlider, { props: { modelValue: 42, showValue: true } })
    expect(wrapper.find('.ev-slider__values').text()).toBe('42')
  })

  it('survives a zero-width range without dividing by zero', () => {
    const wrapper = mount(EvSlider, { props: { min: 5, max: 5, modelValue: 5 } })
    expect(wrapper.find('.ev-slider__fill').attributes('style')).toContain('width: 0%')
  })
})
