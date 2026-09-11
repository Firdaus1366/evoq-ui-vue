import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvKbd from './EvKbd.vue'

describe('EvKbd', () => {
  it('renders a kbd element holding its slot', () => {
    const wrapper = mount(EvKbd, { slots: { default: 'Ctrl' } })
    expect(wrapper.element.tagName).toBe('KBD')
    expect(wrapper.text()).toBe('Ctrl')
  })

  it('defaults to the light text cap', () => {
    const wrapper = mount(EvKbd)
    expect(wrapper.classes()).toContain('ev-kbd--text')
    expect(wrapper.classes()).toContain('ev-kbd--light')
  })

  it('applies the dark icon cap', () => {
    const wrapper = mount(EvKbd, { props: { variant: 'icon', light: false } })
    expect(wrapper.classes()).toContain('ev-kbd--icon')
    expect(wrapper.classes()).toContain('ev-kbd--dark')
  })
})
