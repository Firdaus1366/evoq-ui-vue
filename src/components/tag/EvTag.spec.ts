import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTag from './EvTag.vue'

describe('EvTag', () => {
  it('renders its label and defaults to the default variant', () => {
    const wrapper = mount(EvTag, { slots: { default: 'Prioritas' } })
    expect(wrapper.find('.ev-tag__label').text()).toBe('Prioritas')
    expect(wrapper.classes()).toContain('ev-tag--default')
  })

  it('applies the outline variant', () => {
    expect(mount(EvTag, { props: { variant: 'outline' } }).classes()).toContain('ev-tag--outline')
  })

  it('has no dismiss button unless removable', () => {
    expect(mount(EvTag).find('.ev-tag__remove').exists()).toBe(false)
  })

  it('emits remove from the dismiss button', async () => {
    const wrapper = mount(EvTag, { props: { removable: true } })
    await wrapper.find('.ev-tag__remove').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('labels the dismiss button', () => {
    const wrapper = mount(EvTag, { props: { removable: true, removeLabel: 'Hapus tag' } })
    expect(wrapper.find('.ev-tag__remove').attributes('aria-label')).toBe('Hapus tag')
  })
})
