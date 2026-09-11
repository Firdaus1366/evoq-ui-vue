import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvHint from './EvHint.vue'

describe('EvHint', () => {
  it('is a dot when no value is given', () => {
    const wrapper = mount(EvHint)
    expect(wrapper.classes()).toContain('ev-hint--dot')
    expect(wrapper.classes()).toContain('ev-hint--medium')
    expect(wrapper.text()).toBe('')
  })

  it('renders a count', () => {
    const wrapper = mount(EvHint, { props: { value: 7 } })
    expect(wrapper.classes()).toContain('ev-hint--count')
    expect(wrapper.text()).toBe('7')
  })

  it('clamps a count above max, matching the 99+ variant', () => {
    const wrapper = mount(EvHint, { props: { value: 250 } })
    expect(wrapper.text()).toBe('99+')
    expect(wrapper.classes()).toContain('ev-hint--wide')
  })

  it('honours a custom max', () => {
    expect(mount(EvHint, { props: { value: 12, max: 9 } }).text()).toBe('9+')
  })

  it('does not widen for a two-character count', () => {
    const wrapper = mount(EvHint, { props: { value: 22 } })
    expect(wrapper.text()).toBe('22')
    expect(wrapper.classes()).not.toContain('ev-hint--wide')
  })

  it('forces the dot even with a value', () => {
    const wrapper = mount(EvHint, { props: { value: 5, dot: true } })
    expect(wrapper.classes()).toContain('ev-hint--dot')
    expect(wrapper.text()).toBe('')
  })

  it('hides the hint completely when value is 0', () => {
    const wrapper = mount(EvHint, { props: { value: 0 } })
    expect(wrapper.find('.ev-hint').exists()).toBe(false)
  })

  it.each(['small', 'medium', 'large'] as const)('applies the %s size', (size) => {
    expect(mount(EvHint, { props: { size } }).classes()).toContain(`ev-hint--${size}`)
  })
})
