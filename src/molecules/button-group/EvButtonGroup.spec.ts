import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvButtonGroup from './EvButtonGroup.vue'
import EvButtonGroupItem from '../../atoms/button-group-item/EvButtonGroupItem.vue'

describe('EvButtonGroup', () => {
  it('is a labelled group', () => {
    const wrapper = mount(EvButtonGroup, { props: { label: 'Halaman' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Halaman')
  })

  it('hands its variant and size down to items that do not override them', () => {
    const wrapper = mount(EvButtonGroup, {
      props: { variant: 'primary', size: 'small' },
      slots: { default: '<button-item />' },
      global: { components: { ButtonItem: EvButtonGroupItem } },
    })
    const item = wrapper.findComponent(EvButtonGroupItem)
    expect(item.classes()).toContain('ev-button-group__item--primary')
    expect(item.classes()).toContain('ev-button-group__item--small')
  })

  it('lets an item override the group', () => {
    const wrapper = mount(EvButtonGroup, {
      props: { variant: 'primary' },
      slots: { default: '<button-item variant="warning" />' },
      global: { components: { ButtonItem: EvButtonGroupItem } },
    })
    expect(wrapper.findComponent(EvButtonGroupItem).classes()).toContain(
      'ev-button-group__item--warning',
    )
  })
})
