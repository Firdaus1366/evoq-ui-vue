import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvAccordion from './EvAccordion.vue'

describe('EvAccordion', () => {
  it('is a collapsed default accordion', () => {
    const wrapper = mount(EvAccordion, { props: { title: 'Detail' } })
    expect(wrapper.classes()).toContain('ev-accordion--default')
    expect(wrapper.find('.ev-accordion__header').attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.ev-accordion__title').text()).toBe('Detail')
  })

  it('wires the header to the panel it controls', () => {
    const wrapper = mount(EvAccordion)
    const header = wrapper.find('.ev-accordion__header')
    const panel = wrapper.find('.ev-accordion__panel')
    expect(header.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('aria-labelledby')).toBe(header.attributes('id'))
  })

  it('toggles on header click', async () => {
    const wrapper = mount(EvAccordion)
    await wrapper.find('.ev-accordion__header').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('reports expanded through aria-expanded', () => {
    const wrapper = mount(EvAccordion, { props: { modelValue: true } })
    expect(wrapper.classes()).toContain('ev-accordion--expanded')
    expect(wrapper.find('.ev-accordion__header').attributes('aria-expanded')).toBe('true')
  })

  it('stays collapsed while disabled, even with modelValue set', () => {
    const wrapper = mount(EvAccordion, { props: { modelValue: true, disabled: true } })
    expect(wrapper.classes()).not.toContain('ev-accordion--expanded')
    expect(wrapper.find('.ev-accordion__header').attributes('aria-expanded')).toBe('false')
  })

  it('does not toggle while disabled', async () => {
    const wrapper = mount(EvAccordion, { props: { disabled: true } })
    await wrapper.find('.ev-accordion__header').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('draws the rule only on the default variant', () => {
    expect(mount(EvAccordion).find('.ev-accordion__rule').exists()).toBe(true)
    expect(
      mount(EvAccordion, { props: { separator: false } })
        .find('.ev-accordion__rule')
        .exists(),
    ).toBe(false)
    expect(
      mount(EvAccordion, { props: { variant: 'card' } })
        .find('.ev-accordion__rule')
        .exists(),
    ).toBe(false)
  })

  it('renders title and subtext from slots', () => {
    const wrapper = mount(EvAccordion, { slots: { title: 'T', subtext: 'S' } })
    expect(wrapper.find('.ev-accordion__title').text()).toBe('T')
    expect(wrapper.find('.ev-accordion__subtext').text()).toBe('S')
  })
})
