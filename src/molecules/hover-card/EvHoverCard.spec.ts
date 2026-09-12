import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EvHoverCard from './EvHoverCard.vue'

const CONTENT = { title: 'Alex', description: 'Product designer', subtext: 'Bergabung 2021' }

describe('EvHoverCard', () => {
  it('is closed until the pointer rests on the trigger', async () => {
    vi.useFakeTimers()
    const wrapper = mount(EvHoverCard, { props: CONTENT, slots: { default: '<a>@alex</a>' } })
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(false)

    await wrapper.trigger('mouseenter')
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(false)
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(true)
    vi.useRealTimers()
  })

  it('opens on focus too, so it is reachable by keyboard', async () => {
    vi.useFakeTimers()
    const wrapper = mount(EvHoverCard, { props: CONTENT })
    await wrapper.trigger('focusin')
    vi.advanceTimersByTime(200)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(true)
    vi.useRealTimers()
  })

  // Board order inside the Title frame: Title, Description, Subtext.
  it('keeps the board order of the card body', () => {
    const wrapper = mount(EvHoverCard, { props: { ...CONTENT, modelValue: true } })
    const parts = Array.from(wrapper.find('.ev-hover-card__body').element.children).map(
      (el) => el.className,
    )
    expect(parts).toEqual([
      'ev-hover-card__title',
      'ev-hover-card__description',
      'ev-hover-card__subtext',
    ])
  })

  it('draws only the lines it was given', () => {
    const wrapper = mount(EvHoverCard, { props: { title: 'Alex', modelValue: true } })
    expect(wrapper.find('.ev-hover-card__description').exists()).toBe(false)
    expect(wrapper.find('.ev-hover-card__subtext').exists()).toBe(false)
  })

  it('honours a controlled modelValue', async () => {
    const wrapper = mount(EvHoverCard, { props: { ...CONTENT, modelValue: false } })
    await wrapper.trigger('mouseenter')
    // Controlled: it stays shut until the parent says otherwise.
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(false)
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(true)
  })

  it('does not open when disabled', async () => {
    vi.useFakeTimers()
    const wrapper = mount(EvHoverCard, { props: { ...CONTENT, disabled: true } })
    await wrapper.trigger('mouseenter')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ev-hover-card__panel').exists()).toBe(false)
    vi.useRealTimers()
  })

  it('ties the panel to its trigger for assistive tech', () => {
    const wrapper = mount(EvHoverCard, { props: { ...CONTENT, modelValue: true } })
    const id = wrapper.find('.ev-hover-card__panel').attributes('id')
    expect(id).toBeTruthy()
    expect(wrapper.find('.ev-hover-card__trigger').attributes('aria-describedby')).toBe(id)
  })

  it('places the panel on the side it was asked for', () => {
    const wrapper = mount(EvHoverCard, {
      props: { ...CONTENT, modelValue: true, placement: 'top' },
    })
    expect(wrapper.find('.ev-hover-card__panel').classes()).toContain('ev-hover-card__panel--top')
  })

  it('lets the content slot replace the body', () => {
    const wrapper = mount(EvHoverCard, {
      props: { ...CONTENT, modelValue: true },
      slots: { content: '<p class="custom">Sendiri</p>' },
    })
    expect(wrapper.find('.ev-hover-card__body').exists()).toBe(false)
    expect(wrapper.find('.custom').exists()).toBe(true)
  })
})
