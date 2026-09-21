import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputTime from './EvInputTime.vue'
import EvTimePicker from '../time-picker/EvTimePicker.vue'
import { to12Hour, to24Hour } from './hourFormat'

// EvInputTime: same node tree as InputDropdown (555:3041) - the differences are
// the clock glyph, no leading icon, and the EvTimePicker it mounts in Slot.
describe('EvInputTime', () => {
  it('draws the notched Title and a trailing clock glyph, in Content', () => {
    const wrapper = mount(EvInputTime, { props: { label: 'Title' } })
    expect(wrapper.find('.ev-input-time__content .ev-input-time__label').text()).toBe('Title')
    expect(wrapper.find('.ev-input-time__content .ev-input-time__glyph svg').exists()).toBe(true)
    expect(wrapper.find('.ev-input-time__lead').exists()).toBe(false)
  })

  it('mounts an EvTimePicker in the slot only while open', async () => {
    const wrapper = mount(EvInputTime)
    expect(wrapper.findComponent(EvTimePicker).exists()).toBe(false)
    await wrapper.setProps({ open: true })
    expect(wrapper.findComponent(EvTimePicker).exists()).toBe(true)
  })

  it('commits the picker value on Apply and closes; Cancel discards', async () => {
    const wrapper = mount(EvInputTime, { props: { open: true, modelValue: '09:15' } })
    const picker = wrapper.findComponent(EvTimePicker)
    picker.vm.$emit('apply', '10:45')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['10:45'])
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])

    const other = mount(EvInputTime, { props: { open: true } })
    other.findComponent(EvTimePicker).vm.$emit('cancel')
    await other.vm.$nextTick()
    expect(other.emitted('update:modelValue')).toBeUndefined()
    expect(other.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('offers 24 jam and 12 jam, and switches the wheel between them', async () => {
    const wrapper = mount(EvInputTime, { props: { open: true } })
    const switches = wrapper.findAll('.ev-input-time__switch')
    expect(switches.map((s) => s.text())).toEqual(['24 jam', '12 jam'])
    expect(wrapper.findComponent(EvTimePicker).props('format')).toBe('default')

    await switches[1]?.trigger('click')
    expect(wrapper.findComponent(EvTimePicker).props('format')).toBe('am-pm')
    expect(wrapper.emitted('update:format')?.[0]).toEqual(['am-pm'])

    await wrapper.findAll('.ev-input-time__switch')[0]?.trigger('click')
    expect(wrapper.findComponent(EvTimePicker).props('format')).toBe('default')
  })

  it('keeps the seconds column when switching notation', async () => {
    const wrapper = mount(EvInputTime, { props: { open: true, format: 'with-seconds' } })
    await wrapper.findAll('.ev-input-time__switch')[1]?.trigger('click')
    expect(wrapper.findComponent(EvTimePicker).props('format')).toBe('am-pm-seconds')
  })

  it('converts the committed value when the notation changes', async () => {
    const wrapper = mount(EvInputTime, { props: { open: true, modelValue: '14:30' } })
    await wrapper.findAll('.ev-input-time__switch')[1]?.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['02:30 PM'])
  })

  it('leaves the switch out when hourSwitch is off', () => {
    const wrapper = mount(EvInputTime, { props: { open: true, hourSwitch: false } })
    expect(wrapper.find('.ev-input-time__switch').exists()).toBe(false)
  })

  it('shows the placeholder while empty and the value once set', async () => {
    const wrapper = mount(EvInputTime, { props: { placeholder: 'Select' } })
    expect(wrapper.find('.ev-input-time__value').text()).toBe('Select')
    await wrapper.setProps({ modelValue: '08:05' })
    expect(wrapper.find('.ev-input-time__value').text()).toBe('08:05')
  })

  it('lets the default slot replace the picker', () => {
    const wrapper = mount(EvInputTime, {
      props: { open: true },
      slots: { default: '<div class="mine" />' },
    })
    expect(wrapper.find('.mine').exists()).toBe(true)
    expect(wrapper.findComponent(EvTimePicker).exists()).toBe(false)
  })

  it('keeps the glyph when disabled and does not open', async () => {
    const wrapper = mount(EvInputTime, { props: { disabled: true } })
    expect(wrapper.find('.ev-input-time__glyph').exists()).toBe(true)
    await wrapper.find('.ev-input-time__content').trigger('click')
    expect(wrapper.emitted('update:open')).toBeUndefined()
  })
})

describe('hour format conversion', () => {
  it('converts 24-hour to 12-hour', () => {
    expect(to12Hour('00:05')).toBe('12:05 AM')
    expect(to12Hour('12:00')).toBe('12:00 PM')
    expect(to12Hour('14:30')).toBe('02:30 PM')
    expect(to12Hour('23:59:10')).toBe('11:59:10 PM')
  })

  it('converts 12-hour to 24-hour', () => {
    expect(to24Hour('12:05 AM')).toBe('00:05')
    expect(to24Hour('12:00 PM')).toBe('12:00')
    expect(to24Hour('02:30 PM')).toBe('14:30')
    expect(to24Hour('11:59:10 PM')).toBe('23:59:10')
  })

  it('leaves a value already in the target notation, and an empty one, alone', () => {
    expect(to12Hour('02:30 PM')).toBe('02:30 PM')
    expect(to24Hour('14:30')).toBe('14:30')
    expect(to12Hour('')).toBe('')
    expect(to24Hour('')).toBe('')
  })
})
