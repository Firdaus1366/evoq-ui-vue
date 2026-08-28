import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvScrollArea from './EvScrollArea.vue'

describe('EvScrollArea', () => {
  it('scrolls vertically by default', () => {
    const wrapper = mount(EvScrollArea)
    expect(wrapper.classes()).toContain('ev-scroll-area--vertical')
  })

  it.each(['vertical', 'horizontal', 'both'] as const)('applies the %s orientation', (o) => {
    expect(mount(EvScrollArea, { props: { orientation: o } }).classes()).toContain(
      `ev-scroll-area--${o}`,
    )
  })

  it('renders its content', () => {
    const wrapper = mount(EvScrollArea, { slots: { default: '<p>Isi panjang</p>' } })
    expect(wrapper.find('p').text()).toBe('Isi panjang')
  })

  it('supports mirror mode', () => {
    const wrapper = mount(EvScrollArea, {
      props: { mirror: true },
      slots: { default: '<span>Mirrored</span>' },
    })
    expect(wrapper.classes()).toContain('ev-scroll-area--mirror')
    expect(wrapper.find('.ev-scroll-area__content').exists()).toBe(true)
  })
})
