import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvBadge from './EvBadge.vue'
import type { BadgeVariant } from '../../types'

const VARIANTS: BadgeVariant[] = ['success', 'waiting', 'neutral', 'draft', 'reject', 'custom']

describe('EvBadge', () => {
  it('renders its label', () => {
    const wrapper = mount(EvBadge, { slots: { default: 'Selesai' } })
    expect(wrapper.find('.ev-badge__label').text()).toBe('Selesai')
  })

  it('defaults to the neutral variant, not reversed', () => {
    const wrapper = mount(EvBadge)
    expect(wrapper.classes()).toContain('ev-badge--neutral')
    expect(wrapper.classes()).not.toContain('ev-badge--reverse')
  })

  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    expect(mount(EvBadge, { props: { variant } }).classes()).toContain(`ev-badge--${variant}`)
  })

  it('applies the reverse modifier alongside the variant', () => {
    const wrapper = mount(EvBadge, { props: { variant: 'success', reverse: true } })
    expect(wrapper.classes()).toContain('ev-badge--success')
    expect(wrapper.classes()).toContain('ev-badge--reverse')
  })

  it('renders both icon slots', () => {
    const wrapper = mount(EvBadge, {
      slots: { iconLeft: '<i class="l" />', iconRight: '<i class="r" />' },
    })
    expect(wrapper.find('i.l').exists()).toBe(true)
    expect(wrapper.find('i.r').exists()).toBe(true)
  })
})
