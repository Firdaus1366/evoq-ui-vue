import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvToggle from './EvToggle.vue'
import EvToggleGroup from './EvToggleGroup.vue'

describe('EvToggle', () => {
  it('is an unpressed default toggle by default', () => {
    const wrapper = mount(EvToggle, { slots: { default: 'Filter' } })
    expect(wrapper.attributes('aria-pressed')).toBe('false')
    expect(wrapper.classes()).toContain('ev-toggle--default')
    expect(wrapper.classes()).toContain('ev-toggle--size-default')
    expect(wrapper.text()).toBe('Filter')
  })

  it('namespaces the size so it cannot collide with the default variant', () => {
    const wrapper = mount(EvToggle, { props: { variant: 'default', size: 'default' } })
    const classes = wrapper.classes()
    expect(classes).toContain('ev-toggle--default')
    expect(classes).toContain('ev-toggle--size-default')
  })

  it('toggles pressed state on click', async () => {
    const wrapper = mount(EvToggle)
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('reports pressed through aria-pressed', () => {
    const wrapper = mount(EvToggle, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-pressed')).toBe('true')
    expect(wrapper.classes()).toContain('ev-toggle--active')
  })

  it('does not toggle while disabled', async () => {
    const wrapper = mount(EvToggle, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('applies the outline variant and small size', () => {
    const wrapper = mount(EvToggle, { props: { variant: 'outline', size: 'small' } })
    expect(wrapper.classes()).toContain('ev-toggle--outline')
    expect(wrapper.classes()).toContain('ev-toggle--size-small')
  })
})

describe('EvToggleGroup', () => {
  it('is a labelled group', () => {
    const wrapper = mount(EvToggleGroup, { props: { label: 'Tampilan' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Tampilan')
  })

  it('carries the size on its own class, for the gap', () => {
    expect(mount(EvToggleGroup, { props: { size: 'small' } }).classes()).toContain(
      'ev-toggle-group--size-small',
    )
  })

  it('cascades variant and size to child EvToggle components', () => {
    const parent = mount({
      components: { EvToggleGroup, EvToggle },
      template: `
        <EvToggleGroup variant="outline" size="small">
          <EvToggle id="t1">Item 1</EvToggle>
          <EvToggle id="t2" variant="default" size="default">Item 2</EvToggle>
        </EvToggleGroup>
      `,
    })
    const t1 = parent.find('#t1')
    const t2 = parent.find('#t2')
    expect(t1.classes()).toContain('ev-toggle--outline')
    expect(t1.classes()).toContain('ev-toggle--size-small')
    // t2 overrides group props
    expect(t2.classes()).toContain('ev-toggle--default')
    expect(t2.classes()).toContain('ev-toggle--size-default')
  })
})
