import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvDirection from './EvDirection.vue'
import EvLogo from '../logo/EvLogo.vue'

describe('EvDirection', () => {
  it("renders Figma's Top Slot above the header, only when filled", () => {
    expect(mount(EvDirection).find('.ev-direction__top-slot').exists()).toBe(false)

    const wrapper = mount(EvDirection, {
      props: { title: 'Judul' },
      slots: { topSlot: 'Ilustrasi' },
    })
    const body = wrapper.find('.ev-direction__body')
    const order = Array.from(body.element.children).map((el) => (el as Element).className)
    expect(order[0]).toBe('ev-direction__top-slot')
    expect(order[1]).toBe('ev-direction__header')
  })

  it('is a labelled panel', () => {
    const wrapper = mount(EvDirection, { props: { title: 'Lengkapi profil' } })
    expect(wrapper.element.tagName).toBe('SECTION')
    expect(wrapper.attributes('aria-labelledby')).toBe(
      wrapper.find('.ev-direction__title').element.id,
    )
    expect(wrapper.find('.ev-direction__title').text()).toBe('Lengkapi profil')
  })

  it('renders the subtext only when given', () => {
    expect(mount(EvDirection).find('.ev-direction__subtext').exists()).toBe(false)
    expect(
      mount(EvDirection, { props: { subtext: 'Isi data berikut' } })
        .find('.ev-direction__subtext')
        .text(),
    ).toBe('Isi data berikut')
  })

  it('shows the header action by default, and hides it on request', () => {
    const shown = mount(EvDirection, { slots: { headerAction: '<button class="x" />' } })
    expect(shown.find('.ev-direction__header-action .x').exists()).toBe(true)

    const hidden = mount(EvDirection, {
      props: { hasHeaderAction: false },
      slots: { headerAction: '<button class="x" />' },
    })
    expect(hidden.find('.ev-direction__header-action').exists()).toBe(false)
  })

  it('renders the confirm action by default', () => {
    const wrapper = mount(EvDirection, { slots: { confirm: '<button class="ok" />' } })
    expect(wrapper.find('.ev-direction__footer .ok').exists()).toBe(true)
  })

  it('drops the confirm action for a read-only panel, keeping the cancel', () => {
    const wrapper = mount(EvDirection, {
      props: { hasConfirm: false },
      slots: { confirm: '<button class="ok" />', cancel: '<button class="no" />' },
    })
    expect(wrapper.find('.ok').exists()).toBe(false)
    expect(wrapper.find('.no').exists()).toBe(true)
  })

  it('omits the footer when there is nothing to put in it', () => {
    expect(mount(EvDirection).find('.ev-direction__footer').exists()).toBe(false)
    expect(
      mount(EvDirection, { props: { hasConfirm: false }, slots: { confirm: '<button />' } })
        .find('.ev-direction__footer')
        .exists(),
    ).toBe(false)
  })

  it('renders the body slot', () => {
    const wrapper = mount(EvDirection, { slots: { default: '<input class="f" />' } })
    expect(wrapper.find('.ev-direction__content .f').exists()).toBe(true)
  })
})

describe('EvLogo', () => {
  it('renders the mark, named for assistive tech', () => {
    const wrapper = mount(EvLogo)
    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBe('EVOQ')
  })

  it('hides itself when the label is cleared, for decorative use', () => {
    const svg = mount(EvLogo, { props: { label: '' } }).find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('role')).toBeUndefined()
  })

  it('takes a numeric size as pixels and a string verbatim', () => {
    expect(
      mount(EvLogo, { props: { size: 48 } })
        .find('svg')
        .attributes('style'),
    ).toContain('48px')
    expect(
      mount(EvLogo, { props: { size: '3rem' } })
        .find('svg')
        .attributes('style'),
    ).toContain('3rem')
  })

  it('renders a wordmark only when one is supplied', () => {
    expect(mount(EvLogo).find('.ev-logo__wordmark').exists()).toBe(false)
    expect(
      mount(EvLogo, { slots: { default: 'EVOQ' } })
        .find('.ev-logo__wordmark')
        .text(),
    ).toBe('EVOQ')
  })
})
