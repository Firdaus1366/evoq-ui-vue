import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import EvAvatar from '../../atoms/avatar/EvAvatar.vue'
import EvAvatarGroup from './EvAvatarGroup.vue'

describe('EvAvatarGroup', () => {
  it('is a labelled group carrying its size', () => {
    const wrapper = mount(EvAvatarGroup, { props: { size: 48, label: 'Tim' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Tim')
    expect(wrapper.classes()).toContain('ev-avatar-group--48')
  })

  it('holds its avatars', () => {
    const wrapper = mount(EvAvatarGroup, {
      slots: { default: () => [h(EvAvatar, { label: 'A' }), h(EvAvatar, { label: 'B' })] },
    })
    expect(wrapper.findAll('.ev-avatar')).toHaveLength(2)
  })
})
