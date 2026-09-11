import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvButtonGroupItem from './EvButtonGroupItem.vue'

describe('EvButtonGroupItem', () => {
  it('reports its selected state through aria-pressed', () => {
    expect(mount(EvButtonGroupItem, { props: { active: true } }).attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(EvButtonGroupItem, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
