import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount } from '@vue/test-utils'
import EvAvatar from './EvAvatar.vue'
import EvAvatarGroup from './EvAvatarGroup.vue'
import type { AvatarSize, AvatarVariant } from '../../types'

const SIZES: AvatarSize[] = [24, 32, 40, 48, 64, 96]
const TINTS: AvatarVariant[] = ['green', 'blue', 'orange', 'purple', 'teal', 'pink']

describe('EvAvatar', () => {
  it('is a 32px blue avatar by default', () => {
    const wrapper = mount(EvAvatar, { props: { label: 'EV' } })
    expect(wrapper.classes()).toContain('ev-avatar--32')
    expect(wrapper.classes()).toContain('ev-avatar--blue')
    expect(wrapper.find('.ev-avatar__label').text()).toBe('EV')
  })

  it.each(SIZES)('applies the %ipx size', (size) => {
    expect(mount(EvAvatar, { props: { size } }).classes()).toContain(`ev-avatar--${size}`)
  })

  it.each(TINTS)('applies the %s tint', (variant) => {
    expect(mount(EvAvatar, { props: { variant } }).classes()).toContain(`ev-avatar--${variant}`)
  })

  it('names itself for assistive tech', () => {
    expect(mount(EvAvatar, { props: { label: 'EV' } }).attributes('aria-label')).toBe('EV')
    expect(
      mount(EvAvatar, { props: { label: 'EV', alt: 'Evoq Tamvan' } }).attributes('aria-label'),
    ).toBe('Evoq Tamvan')
  })

  it('shows the photo when one is given', () => {
    const wrapper = mount(EvAvatar, { props: { src: '/me.png', alt: 'Saya' } })
    expect(wrapper.find('img').attributes('src')).toBe('/me.png')
    expect(wrapper.find('.ev-avatar__label').exists()).toBe(false)
  })

  it('falls back to the board`s error state when the photo fails', async () => {
    const wrapper = mount(EvAvatar, { props: { src: '/gone.png', variant: 'green' } })
    await wrapper.find('img').trigger('error')
    expect(wrapper.classes()).toContain('ev-avatar--error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.ev-avatar__glyph').exists()).toBe(true)
  })

  it('gives a replaced photo a fresh attempt', async () => {
    const wrapper = mount(EvAvatar, { props: { src: '/gone.png' } })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)

    await wrapper.setProps({ src: '/new.png' })
    expect(wrapper.find('img').attributes('src')).toBe('/new.png')
  })

  it('draws a glyph for the empty and error states', () => {
    for (const variant of ['empty', 'error'] as const) {
      const wrapper = mount(EvAvatar, { props: { variant } })
      expect(wrapper.find('.ev-avatar__glyph').exists()).toBe(true)
      expect(wrapper.find('.ev-avatar__label').exists()).toBe(false)
    }
  })

  it('shows the count for the number state', () => {
    const wrapper = mount(EvAvatar, { props: { variant: 'number', label: '+5' } })
    expect(wrapper.find('.ev-avatar__label').text()).toBe('+5')
  })

  it('lets the whole face be replaced', () => {
    const wrapper = mount(EvAvatar, { slots: { default: '<i class="custom" />' } })
    expect(wrapper.find('i.custom').exists()).toBe(true)
    expect(wrapper.find('.ev-avatar__label').exists()).toBe(false)
  })
})

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
