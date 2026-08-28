import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCalendar from './EvCalendar.vue'

/** January 2026 starts on a Thursday - a month with a visible lead-in. */
const JAN_2026 = new Date(2026, 0, 1)

const dayButtons = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.ev-calendar__day')

describe('EvCalendar', () => {
  it('always draws six full weeks, so the grid never changes height', () => {
    const wrapper = mount(EvCalendar, { props: { month: JAN_2026 } })
    expect(dayButtons(wrapper)).toHaveLength(42)
    expect(wrapper.findAll('.ev-calendar__weekday')).toHaveLength(7)
  })

  it('marks days from the neighbouring months as outside', () => {
    const wrapper = mount(EvCalendar, { props: { month: JAN_2026 } })
    const outside = wrapper.findAll('.ev-calendar__day--outside')
    expect(outside.length).toBeGreaterThan(0)
    // 1 January 2026 is a Thursday, so a Monday-first grid leads with 3 days.
    expect(outside[0]!.text()).toBe('29')
  })

  it('starts the week where it is told to', () => {
    const monday = mount(EvCalendar, {
      props: { month: JAN_2026, weekStartsOn: 1, locale: 'en-GB' },
    })
    const sunday = mount(EvCalendar, {
      props: { month: JAN_2026, weekStartsOn: 0, locale: 'en-GB' },
    })
    expect(monday.findAll('.ev-calendar__weekday')[0]!.text()).toBe('Mon')
    expect(sunday.findAll('.ev-calendar__weekday')[0]!.text()).toBe('Sun')
  })

  it('emits the chosen date in single mode', async () => {
    const wrapper = mount(EvCalendar, { props: { month: JAN_2026 } })
    const first = dayButtons(wrapper).find((b) => b.text() === '15')!
    await first.trigger('click')

    const emitted = wrapper.emitted('update:modelValue')![0]![0] as Date
    expect(emitted.getDate()).toBe(15)
    expect(emitted.getMonth()).toBe(0)
  })

  it('marks the selected day', () => {
    const wrapper = mount(EvCalendar, {
      props: { month: JAN_2026, modelValue: new Date(2026, 0, 15) },
    })
    const selected = wrapper.find('.ev-calendar__day--selected')
    expect(selected.text()).toBe('15')
    expect(selected.attributes('aria-selected')).toBe('true')
  })

  it('opens a range on the first click and closes it on the second', async () => {
    const wrapper = mount(EvCalendar, { props: { month: JAN_2026, mode: 'range' } })
    await dayButtons(wrapper)
      .find((b) => b.text() === '10')!
      .trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual([new Date(2026, 0, 10), null])

    await wrapper.setProps({ modelValue: [new Date(2026, 0, 10), null] })
    await dayButtons(wrapper)
      .find((b) => b.text() === '20')!
      .trigger('click')
    expect(wrapper.emitted('update:modelValue')![1]![0]).toEqual([
      new Date(2026, 0, 10),
      new Date(2026, 0, 20),
    ])
  })

  it('orders a backwards range rather than storing it inverted', async () => {
    const wrapper = mount(EvCalendar, {
      props: { month: JAN_2026, mode: 'range', modelValue: [new Date(2026, 0, 20), null] },
    })
    await dayButtons(wrapper)
      .find((b) => b.text() === '10')!
      .trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual([
      new Date(2026, 0, 10),
      new Date(2026, 0, 20),
    ])
  })

  it('starts a fresh range once one is complete', async () => {
    const wrapper = mount(EvCalendar, {
      props: {
        month: JAN_2026,
        mode: 'range',
        modelValue: [new Date(2026, 0, 10), new Date(2026, 0, 20)],
      },
    })
    await dayButtons(wrapper)
      .find((b) => b.text() === '25')!
      .trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]![0]).toEqual([new Date(2026, 0, 25), null])
  })

  it('draws the ends and the middle of a range differently', () => {
    const wrapper = mount(EvCalendar, {
      props: {
        month: JAN_2026,
        mode: 'range',
        modelValue: [new Date(2026, 0, 10), new Date(2026, 0, 14)],
      },
    })
    expect(wrapper.find('.ev-calendar__day--l-select').text()).toBe('10')
    expect(wrapper.find('.ev-calendar__day--r-select').text()).toBe('14')
    // 11, 12 and 13 sit between them.
    expect(wrapper.findAll('.ev-calendar__day--range')).toHaveLength(3)
  })

  it('disables dates outside min and max, and refuses to select them', async () => {
    const wrapper = mount(EvCalendar, {
      props: { month: JAN_2026, min: new Date(2026, 0, 10), max: new Date(2026, 0, 20) },
    })
    const early = dayButtons(wrapper).find((b) => b.text() === '5')!
    expect(early.attributes('disabled')).toBeDefined()

    await early.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('marks event days', () => {
    const wrapper = mount(EvCalendar, {
      props: { month: JAN_2026, events: [new Date(2026, 0, 9)] },
    })
    expect(wrapper.find('.ev-calendar__day--event').text()).toBe('9')
  })

  it('pages the month, and reports it', async () => {
    const wrapper = mount(EvCalendar, { props: { locale: 'en-GB' } })
    const label = () => wrapper.find('.ev-calendar__month').text()
    const before = label()

    await wrapper.find('.ev-calendar__nav').trigger('click')
    expect(label()).not.toBe(before)
    expect(wrapper.emitted('update:month')).toHaveLength(1)
  })

  it('follows a controlled month instead of its own', async () => {
    const wrapper = mount(EvCalendar, { props: { month: JAN_2026, locale: 'en-GB' } })
    expect(wrapper.find('.ev-calendar__month').text()).toContain('January')

    await wrapper.setProps({ month: new Date(2026, 5, 1) })
    expect(wrapper.find('.ev-calendar__month').text()).toContain('June')
  })
})
