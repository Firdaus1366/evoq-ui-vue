import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvToggle from '../../atoms/toggle/EvToggle.vue'
import EvToggleGroup from './EvToggleGroup.vue'

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
