import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTimePicker from './EvTimePicker.vue'

describe('EvTimePicker', () => {
  it('renders 24-hour time picker with default hours and minutes', () => {
    const wrapper = mount(EvTimePicker, {
      props: {
        modelValue: '14:30',
      },
    })

    expect(wrapper.text()).toContain('14:30')
    const cols = wrapper.findAll('.ev-time-picker__col')
    expect(cols.length).toBe(2) // Hour and Minute
  })

  it('renders seconds column when format is with-seconds', () => {
    const wrapper = mount(EvTimePicker, {
      props: {
        format: 'with-seconds',
        modelValue: '08:15:45',
      },
    })

    expect(wrapper.text()).toContain('08:15:45')
    const cols = wrapper.findAll('.ev-time-picker__col')
    expect(cols.length).toBe(3) // Hour, Minute, Second
  })

  it('renders AM/PM period column when format is am-pm', () => {
    const wrapper = mount(EvTimePicker, {
      props: {
        format: 'am-pm',
        modelValue: '09:30 AM',
      },
    })

    expect(wrapper.text()).toContain('AM')
    expect(wrapper.text()).toContain('PM')
    const cols = wrapper.findAll('.ev-time-picker__col')
    expect(cols.length).toBe(3) // Hour, Minute, Period
  })

  it('emits apply event when apply button is clicked', async () => {
    const wrapper = mount(EvTimePicker, {
      props: {
        modelValue: '10:00',
      },
    })

    const applyBtn = wrapper.find('.ev-time-picker__btn--apply')
    await applyBtn.trigger('click')
    expect(wrapper.emitted('apply')?.[0]).toEqual(['10:00'])
  })
})
