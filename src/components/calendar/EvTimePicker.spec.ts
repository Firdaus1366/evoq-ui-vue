import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTimePicker from './EvTimePicker.vue'

describe('EvTimePicker', () => {
  it('renders the three node siblings in the order the board draws them', () => {
    const wrapper = mount(EvTimePicker)

    const children = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(children).toEqual([
      'ev-time-picker__display',
      'ev-time-picker__wheel',
      'ev-time-picker__footer',
    ])
  })

  it('draws no title above the value - the board has no such node', () => {
    const wrapper = mount(EvTimePicker)
    expect(wrapper.find('.ev-time-picker__title').exists()).toBe(false)
    expect(wrapper.find('.ev-time-picker__col-label').exists()).toBe(false)
  })

  it('renders 24-hour columns by default, split by a colon', () => {
    const wrapper = mount(EvTimePicker, { props: { modelValue: '14:30' } })

    expect(wrapper.find('.ev-time-picker__value').text()).toBe('14:30')
    expect(wrapper.findAll('.ev-time-picker__column')).toHaveLength(2)
    expect(wrapper.findAll('.ev-time-picker__separator')).toHaveLength(1)
    expect(wrapper.find('.ev-time-picker__separator').text()).toBe(':')
  })

  it('renders the selection band behind the wheel', () => {
    const wrapper = mount(EvTimePicker)
    const wheel = wrapper.find('.ev-time-picker__wheel')
    expect((wheel.element.children[0] as Element).className).toBe('ev-time-picker__band')
  })

  it('makes every value reachable and marks the current one', () => {
    const wrapper = mount(EvTimePicker, { props: { modelValue: '14:30' } })
    const [hourColumn, minuteColumn] = wrapper.findAll('.ev-time-picker__column')

    // The board draws a wheel; rendering its seven frozen rows literally would
    // leave 14:30 unable to reach 14:45.
    expect(hourColumn!.findAll('.ev-time-picker__item')).toHaveLength(24)
    expect(minuteColumn!.findAll('.ev-time-picker__item')).toHaveLength(60)

    const selected = hourColumn!.findAll('.ev-time-picker__item--selected')
    expect(selected).toHaveLength(1)
    expect(selected[0]!.text()).toBe('14')
    expect(selected[0]!.attributes('aria-selected')).toBe('true')
  })

  it('renders a seconds column with its own colon', () => {
    const wrapper = mount(EvTimePicker, {
      props: { format: 'with-seconds', modelValue: '08:15:45' },
    })

    expect(wrapper.find('.ev-time-picker__value').text()).toBe('08:15:45')
    expect(wrapper.findAll('.ev-time-picker__column')).toHaveLength(3)
    expect(wrapper.findAll('.ev-time-picker__separator')).toHaveLength(2)
  })

  it('adds the meridiem column without a colon before it', () => {
    const wrapper = mount(EvTimePicker, {
      props: { format: 'am-pm', modelValue: '09:30 AM' },
    })

    expect(wrapper.find('.ev-time-picker__value').text()).toBe('09:30 AM')
    expect(wrapper.findAll('.ev-time-picker__column')).toHaveLength(3)
    // Only one colon - the board puts none between the minute and AM/PM.
    expect(wrapper.findAll('.ev-time-picker__separator')).toHaveLength(1)
  })

  it('puts Apply above Cancel, as the board stacks them', () => {
    const wrapper = mount(EvTimePicker)
    const buttons = wrapper.findAll('.ev-time-picker__btn')

    expect(buttons[0]!.classes()).toContain('ev-time-picker__btn--apply')
    expect(buttons[0]!.text()).toBe('Apply')
    expect(buttons[1]!.classes()).toContain('ev-time-picker__btn--cancel')
    expect(buttons[1]!.text()).toBe('Cancel')
  })

  it('picks any row in the column, however far from the current value', async () => {
    const wrapper = mount(EvTimePicker, { props: { modelValue: '14:30' } })
    const minuteColumn = wrapper.findAll('.ev-time-picker__column')[1]!

    // 45 is fifteen rows away - unreachable while only neighbours rendered.
    await minuteColumn.findAll('.ev-time-picker__item')[45]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['14:45'])
  })

  it('shows the reset glyph only when Has Reset Button is on', async () => {
    expect(mount(EvTimePicker).find('.ev-time-picker__reset').exists()).toBe(false)

    const wrapper = mount(EvTimePicker, { props: { hasReset: true, modelValue: '14:30' } })
    await wrapper.find('.ev-time-picker__reset').trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
    expect(wrapper.find('.ev-time-picker__value').text()).toBe('00:00')
  })

  it('emits apply with the current value', async () => {
    const wrapper = mount(EvTimePicker, { props: { modelValue: '10:00' } })
    await wrapper.find('.ev-time-picker__btn--apply').trigger('click')
    expect(wrapper.emitted('apply')?.[0]).toEqual(['10:00'])
  })
})
