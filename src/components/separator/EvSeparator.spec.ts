import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvSeparator from './EvSeparator.vue'

describe('EvSeparator', () => {
  it('is a horizontal separator by default', () => {
    const wrapper = mount(EvSeparator)
    expect(wrapper.classes()).toContain('ev-separator--horizontal')
    expect(wrapper.attributes('role')).toBe('separator')
    expect(wrapper.attributes('aria-orientation')).toBe('horizontal')
  })

  it('applies the vertical orientation', () => {
    const wrapper = mount(EvSeparator, { props: { orientation: 'vertical' } })
    expect(wrapper.classes()).toContain('ev-separator--vertical')
    expect(wrapper.attributes('aria-orientation')).toBe('vertical')
  })

  it('hides a decorative rule from assistive tech', () => {
    const wrapper = mount(EvSeparator, { props: { decorative: true } })
    expect(wrapper.attributes('role')).toBe('none')
    expect(wrapper.attributes('aria-orientation')).toBeUndefined()
  })
})
