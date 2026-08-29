import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCalendar from './EvCalendar.vue'

/** January 2026 starts on a Thursday - a month with a visible lead-in. */
const JAN_2026 = new Date(2026, 0, 1)

const dayButtons = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.ev-calendar__day')

describe('EvCalendar', () => {
  it('draws the mobile board: bare chevrons, a read-out, and a split footer', () => {
    const wrapper = mount(EvCalendar, { props: { platform: 'mobile' } })

    expect(wrapper.classes()).toContain('ev-calendar--mobile')
    // Mobile always closes with a footer, even in single-date mode.
    expect(wrapper.find('.ev-calendar__footer').exists()).toBe(true)
    expect(wrapper.find('.ev-calendar__readout-value').text()).toBe('DD MMM YYYY')
    // The read-out row comes before the buttons.
    const footer = wrapper.find('.ev-calendar__footer')
    const order = Array.from(footer.element.children).map((el) => (el as Element).className)
    expect(order).toEqual(['ev-calendar__readout', 'ev-calendar__footer-row'])
  })

  it('moves the reset control into the read-out on mobile', () => {
    const desktop = mount(EvCalendar, { props: { mode: 'range', hasReset: true } })
    expect(desktop.find('.ev-calendar__btn--reset').exists()).toBe(true)
    expect(desktop.find('.ev-calendar__readout-reset').exists()).toBe(false)

    const mobile = mount(EvCalendar, { props: { platform: 'mobile', hasReset: true } })
    expect(mobile.find('.ev-calendar__btn--reset').exists()).toBe(false)
    expect(mobile.find('.ev-calendar__readout-reset').exists()).toBe(true)
  })

  it("stacks month blocks in the board's Full Calendar view", () => {
    const wrapper = mount(EvCalendar, {
      props: { view: 'full', fullMonths: 3, month: new Date(2026, 0, 1) },
    })

    const blocks = wrapper.findAll('.ev-calendar__block')
    expect(blocks).toHaveLength(3)
    // Each block labels itself instead of paging.
    expect(blocks.map((b) => b.find('.ev-calendar__block-label').text())).toEqual([
      'Januari 2026',
      'Februari 2026',
      'Maret 2026',
    ])
    expect(wrapper.findAll('.ev-calendar__nav')).toHaveLength(0)
    expect(blocks[0]!.findAll('.ev-calendar__day')).toHaveLength(42)
  })

  it('floats the Month Open overlay over the header as a DropdownList', async () => {
    const wrapper = mount(EvCalendar, { props: { month: new Date(2026, 0, 1) } })
    expect(wrapper.find('.ev-calendar__overlay').exists()).toBe(false)

    await wrapper.find('.ev-calendar__month').trigger('click')
    expect(wrapper.emitted('update:monthOpen')?.at(-1)).toEqual([true])

    const open = mount(EvCalendar, { props: { monthOpen: true, month: new Date(2026, 0, 1) } })
    const overlay = open.find('.ev-calendar__overlay')
    expect(overlay.exists()).toBe(true)
    expect(overlay.findAll('.ev-dropdown-item')).toHaveLength(12)
    expect(overlay.findAll('.ev-dropdown-item--active')).toHaveLength(1)
  })

  it('lists the 36-year block in the Year Open overlay', async () => {
    const wrapper = mount(EvCalendar, {
      props: { yearOpen: true, month: new Date(2026, 0, 1) },
    })

    const overlay = wrapper.find('.ev-calendar__overlay')
    expect(overlay.findAll('.ev-dropdown-item')).toHaveLength(36)

    await overlay.findAll('.ev-dropdown-item')[0]!.trigger('click') // 1991
    expect((wrapper.emitted('update:month')?.at(-1)?.[0] as Date).getFullYear()).toBe(1991)
    expect(wrapper.emitted('update:yearOpen')?.at(-1)).toEqual([false])
  })

  it('opens only one overlay at a time', async () => {
    const wrapper = mount(EvCalendar, { props: { yearOpen: true } })
    await wrapper.find('.ev-calendar__month').trigger('click')

    expect(wrapper.emitted('update:yearOpen')?.at(-1)).toEqual([false])
    expect(wrapper.emitted('update:monthOpen')?.at(-1)).toEqual([true])
  })

  it("renders the board's Month grid: 12 cells, three across", () => {
    const wrapper = mount(EvCalendar, { props: { view: 'month', month: new Date(2026, 0, 1) } })

    const cells = wrapper.findAll('.ev-calendar__cells .ev-calendar__day')
    expect(cells).toHaveLength(12)
    expect(cells.every((c) => c.classes().includes('ev-calendar__day--wide'))).toBe(true)
    // The header pages by year, not by month.
    expect(wrapper.find('.ev-calendar__month').text()).toBe('2026')
    expect(wrapper.findAll('.ev-calendar__day--event')).toHaveLength(0)
  })

  it("renders the board's Year grid: a 36-year block, labelled and unpaged", () => {
    const wrapper = mount(EvCalendar, { props: { view: 'year', month: new Date(2026, 0, 1) } })

    expect(wrapper.findAll('.ev-calendar__cells .ev-calendar__day')).toHaveLength(36)
    expect(wrapper.find('.ev-calendar__month').text()).toBe('1991 - 2026')
    // node: Frame 11 carries no chevrons.
    expect(wrapper.findAll('.ev-calendar__nav')).toHaveLength(0)
  })

  it('pages the Month grid by year and drops back to the day grid on pick', async () => {
    const wrapper = mount(EvCalendar, { props: { view: 'month', month: new Date(2026, 0, 1) } })

    await wrapper.findAll('.ev-calendar__nav')[1]!.trigger('click')
    expect((wrapper.emitted('update:month')?.[0]?.[0] as Date).getFullYear()).toBe(2027)

    await wrapper.findAll('.ev-calendar__cells .ev-calendar__day')[4]!.trigger('click') // May
    expect((wrapper.emitted('update:month')?.at(-1)?.[0] as Date).getMonth()).toBe(4)
    expect(wrapper.emitted('update:view')?.at(-1)).toEqual(['day'])
  })

  it('steps the Year grid up to the Month grid on pick', async () => {
    const wrapper = mount(EvCalendar, { props: { view: 'year', month: new Date(2026, 0, 1) } })

    await wrapper.findAll('.ev-calendar__cells .ev-calendar__day')[0]!.trigger('click') // 1991
    expect((wrapper.emitted('update:month')?.at(-1)?.[0] as Date).getFullYear()).toBe(1991)
    expect(wrapper.emitted('update:view')?.at(-1)).toEqual(['month'])
  })

  it('marks the current month and the current year with the Today state', () => {
    const now = new Date()
    const monthView = mount(EvCalendar, { props: { view: 'month', month: now } })
    expect(monthView.findAll('.ev-calendar__day--today')).toHaveLength(1)

    const yearView = mount(EvCalendar, { props: { view: 'year', month: now } })
    expect(yearView.findAll('.ev-calendar__day--today')).toHaveLength(1)
  })

  it('keeps the day grid out of the way in the month and year views', () => {
    expect(
      mount(EvCalendar, { props: { view: 'month' } })
        .find('.ev-calendar__weekdays')
        .exists(),
    ).toBe(false)
    expect(mount(EvCalendar).find('.ev-calendar__cells').exists()).toBe(false)
  })

  it('draws the filter row BELOW the calendar, as the board orders it', () => {
    const wrapper = mount(EvCalendar, { props: { presets: true } })

    const children = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(children).toEqual([
      'ev-calendar__calendar',
      'ev-calendar__filter',
      'ev-calendar__footer',
    ])
  })

  it("renders the board's seven presets in its drawn order", () => {
    const wrapper = mount(EvCalendar, { props: { presets: true } })
    expect(wrapper.findAll('.ev-calendar__preset').map((b) => b.text())).toEqual([
      'Yesterday',
      'Today',
      'Tomorrow',
      'This week',
      'Last week',
      'This month',
      'Last month',
    ])
  })

  it('draws two month panels in range mode', () => {
    expect(mount(EvCalendar).findAll('.ev-calendar__panel')).toHaveLength(1)

    const wrapper = mount(EvCalendar, { props: { mode: 'range' } })
    expect(wrapper.findAll('.ev-calendar__panel')).toHaveLength(2)
    // The back chevron rides the first panel, the forward one the last.
    const panels = wrapper.findAll('.ev-calendar__panel')
    expect(panels[0]!.findAll('.ev-calendar__nav')).toHaveLength(1)
    expect(panels[1]!.findAll('.ev-calendar__nav')).toHaveLength(1)
  })

  it('shows a footer for range and for presets, and none for plain Basic', () => {
    expect(mount(EvCalendar).find('.ev-calendar__footer').exists()).toBe(false)
    expect(
      mount(EvCalendar, { props: { mode: 'range' } })
        .find('.ev-calendar__footer')
        .exists(),
    ).toBe(true)
    expect(
      mount(EvCalendar, { props: { presets: true } })
        .find('.ev-calendar__footer')
        .exists(),
    ).toBe(true)
  })

  it("closes the Basic variant with the board's Select Time link", async () => {
    expect(mount(EvCalendar).find('.ev-calendar__time-link').exists()).toBe(false)

    const wrapper = mount(EvCalendar, { props: { showTimeLink: true } })
    const link = wrapper.find('.ev-calendar__time-link')
    expect(link.text()).toBe('Select Time')
    await link.trigger('click')
    expect(wrapper.emitted('select-time')).toHaveLength(1)
  })

  it('keeps the weekday row and the day rows as separate frames', () => {
    const wrapper = mount(EvCalendar)
    expect(wrapper.findAll('.ev-calendar__weekdays .ev-calendar__weekday')).toHaveLength(7)
    expect(wrapper.findAll('.ev-calendar__days .ev-calendar__day')).toHaveLength(42)
  })

  it('emits a range when a preset is picked in range mode', async () => {
    const wrapper = mount(EvCalendar, { props: { presets: true, mode: 'range' } })
    await wrapper.findAll('.ev-calendar__preset')[1]!.trigger('click') // Today

    const emitted = wrapper.emitted('update:modelValue')?.[0]?.[0] as [Date, Date]
    expect(Array.isArray(emitted)).toBe(true)
    expect(emitted[0]!.getDate()).toBe(new Date().getDate())
  })

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
