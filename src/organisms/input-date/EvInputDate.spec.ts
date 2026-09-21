import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputDate from './EvInputDate.vue'
import EvCalendar from '../calendar/EvCalendar.vue'

const cls = (el: Element) => el.className.split(' ')[0]

// EvInputDate: same node tree as InputDropdown (555:3041) - the differences are
// the calendar glyph, no leading icon, and the EvCalendar it mounts in Slot.
describe('EvInputDate', () => {
  it('draws the notched Title and a trailing calendar glyph, in Content', () => {
    const wrapper = mount(EvInputDate, { props: { label: 'Title' } })
    expect(wrapper.find('.ev-input-date__content .ev-input-date__label').text()).toBe('Title')
    expect(wrapper.find('.ev-input-date__content .ev-input-date__glyph svg').exists()).toBe(true)
    expect(wrapper.find('.ev-input-date__lead').exists()).toBe(false)
  })

  it('draws content, then slot, then message, in board order', () => {
    const wrapper = mount(EvInputDate, {
      props: { open: true, error: true, validationText: 'Validation Text' },
    })
    expect(Array.from((wrapper.element as Element).children).map(cls)).toEqual([
      'ev-input-date__content',
      'ev-input-date__slot',
      'ev-input-date__message',
    ])
  })

  it('mounts an EvCalendar in the slot only while open, with Cancel and Select date', async () => {
    const wrapper = mount(EvInputDate)
    expect(wrapper.findComponent(EvCalendar).exists()).toBe(false)
    await wrapper.setProps({ open: true })
    const calendar = wrapper.findComponent(EvCalendar)
    expect(calendar.exists()).toBe(true)
    expect(wrapper.find('.ev-calendar__btn--cancel').text()).toBe('Cancel')
    expect(wrapper.find('.ev-calendar__btn--apply').text()).toBe('Select date')
  })

  it('shows a committed Date formatted, and the placeholder while empty', async () => {
    const wrapper = mount(EvInputDate, { props: { placeholder: 'Select' } })
    expect(wrapper.find('.ev-input-date__value').text()).toBe('Select')
    await wrapper.setProps({ modelValue: new Date(2026, 8, 21) })
    expect(wrapper.find('.ev-input-date__value').text()).toMatch(/21.*2026/)
  })

  it('commits the chosen day on Select date and closes; Cancel discards it', async () => {
    const wrapper = mount(EvInputDate, {
      props: { open: true, modelValue: null },
    })
    const days = wrapper.findAll('.ev-calendar__days .ev-calendar__day')
    await days[10]?.trigger('click')
    await wrapper.find('.ev-calendar__btn--apply').trigger('click')
    const committed = wrapper.emitted('update:modelValue')?.[0]?.[0]
    expect(committed).toBeInstanceOf(Date)
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])

    const other = mount(EvInputDate, { props: { open: true } })
    await other.findAll('.ev-calendar__days .ev-calendar__day')[10]?.trigger('click')
    await other.find('.ev-calendar__btn--cancel').trigger('click')
    expect(other.emitted('update:modelValue')).toBeUndefined()
    expect(other.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('does nothing on Select date while nothing is picked', async () => {
    const wrapper = mount(EvInputDate, { props: { open: true } })
    await wrapper.find('.ev-calendar__btn--apply').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('has no mode switch: range is the prop and nothing else', () => {
    const single = mount(EvInputDate, { props: { open: true } })
    expect(single.find('.ev-input-date__switch').exists()).toBe(false)
    expect(single.findAll('.ev-calendar__panel')).toHaveLength(1)
    expect(single.emitted('update:mode')).toBeUndefined()
  })

  it('draws two panels in range mode, and needs both ends before it commits', async () => {
    const wrapper = mount(EvInputDate, { props: { open: true, mode: 'range' } })
    expect(wrapper.findAll('.ev-calendar__panel')).toHaveLength(2)

    const days = () => wrapper.findAll('.ev-calendar__days .ev-calendar__day')
    await days()[10]?.trigger('click')
    await wrapper.find('.ev-calendar__btn--apply').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    await days()[15]?.trigger('click')
    await wrapper.find('.ev-calendar__btn--apply').trigger('click')
    const value = wrapper.emitted('update:modelValue')?.[0]?.[0] as [Date, Date]
    expect(value[0]).toBeInstanceOf(Date)
    expect(value[1]).toBeInstanceOf(Date)
  })

  it('drops the draft when the mode prop changes', async () => {
    const wrapper = mount(EvInputDate, { props: { open: true } })
    await wrapper.findAll('.ev-calendar__days .ev-calendar__day')[10]?.trigger('click')
    await wrapper.setProps({ mode: 'range' })
    await wrapper.find('.ev-calendar__btn--apply').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it("ends a single date in the calendar's own Select link, not a filled button", () => {
    const single = mount(EvInputDate, { props: { open: true } })
    expect(single.find('.ev-button-link.ev-calendar__apply-link').exists()).toBe(true)
    expect(single.find('.ev-calendar__btn--cancel').classes()).toContain('ev-button')
    const range = mount(EvInputDate, { props: { open: true, mode: 'range' } })
    expect(range.find('.ev-calendar__apply-link').exists()).toBe(false)
    expect(range.find('.ev-calendar__btn--apply').classes()).toContain('ev-button')
  })

  it('formats a range as from - to', () => {
    const wrapper = mount(EvInputDate, {
      props: { modelValue: [new Date(2026, 8, 1), new Date(2026, 8, 15)] },
    })
    expect(wrapper.find('.ev-input-date__value').text()).toMatch(/01.*2026.*\u2013.*15.*2026/)
  })

  it('lets the default slot replace the calendar', () => {
    const wrapper = mount(EvInputDate, {
      props: { open: true },
      slots: { default: '<div class="mine" />' },
    })
    expect(wrapper.find('.mine').exists()).toBe(true)
    expect(wrapper.findComponent(EvCalendar).exists()).toBe(false)
  })

  it('clears from the open field', async () => {
    const wrapper = mount(EvInputDate, {
      props: { open: true, modelValue: new Date(2026, 8, 21) },
    })
    await wrapper.find('.ev-input-date__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('keeps the glyph when disabled, hides it with hasRightIcon off, and does not open', async () => {
    const disabled = mount(EvInputDate, { props: { disabled: true } })
    expect(disabled.find('.ev-input-date__glyph').exists()).toBe(true)
    await disabled.find('.ev-input-date__content').trigger('click')
    expect(disabled.emitted('update:open')).toBeUndefined()
    expect(
      mount(EvInputDate, { props: { hasRightIcon: false } })
        .find('.ev-input-date__glyph')
        .exists(),
    ).toBe(false)
  })

  it('closes on a pointer down outside, but not inside its own panel', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const wrapper = mount(EvInputDate, { attachTo: host, props: { open: true } })
    wrapper.find('.ev-calendar').element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('update:open')).toBeUndefined()
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false])
    wrapper.unmount()
    host.remove()
  })
})
