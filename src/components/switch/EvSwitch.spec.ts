import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvSwitch from './EvSwitch.vue'

describe('EvSwitch', () => {
  it('exposes itself as an unchecked switch button when no visible label is given', () => {
    const wrapper = mount(EvSwitch, { props: { ariaLabel: 'Notifikasi' } })
    expect(wrapper.attributes('role')).toBe('switch')
    expect(wrapper.attributes('aria-checked')).toBe('false')
    expect(wrapper.attributes('aria-label')).toBe('Notifikasi')
    expect(wrapper.classes()).toContain('ev-switch--off')
  })

  it('renders visible label and subtext from props or slots and wraps in a label', () => {
    const fromProps = mount(EvSwitch, {
      props: { label: 'Notifikasi Email', subtext: 'Kirim rangkuman mingguan' },
    })
    expect(fromProps.classes()).toContain('ev-switch-wrapper')
    expect(fromProps.find('.ev-switch-wrapper__label').text()).toBe('Notifikasi Email')
    expect(fromProps.find('.ev-switch-wrapper__subtext').text()).toBe('Kirim rangkuman mingguan')
    expect(fromProps.find('button[role="switch"]').attributes('aria-checked')).toBe('false')

    const fromSlots = mount(EvSwitch, {
      slots: { default: 'Aktifkan Mode', subtext: 'Keterangan tambahan' },
    })
    expect(fromSlots.find('.ev-switch-wrapper__label').text()).toBe('Aktifkan Mode')
    expect(fromSlots.find('.ev-switch-wrapper__subtext').text()).toBe('Keterangan tambahan')
  })

  it('supports labelPlacement left and right', () => {
    const right = mount(EvSwitch, { props: { label: 'Right', labelPlacement: 'right' } })
    expect(right.classes()).toContain('ev-switch-wrapper--label-right')

    const left = mount(EvSwitch, { props: { label: 'Left', labelPlacement: 'left' } })
    expect(left.classes()).toContain('ev-switch-wrapper--label-left')
  })

  it('toggles on click of standalone switch', async () => {
    const wrapper = mount(EvSwitch)
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('toggles on click of wrapper when field label is present', async () => {
    const wrapper = mount(EvSwitch, { props: { label: 'Notifikasi' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('toggles back when already on', async () => {
    const wrapper = mount(EvSwitch, { props: { modelValue: true } })
    expect(wrapper.attributes('aria-checked')).toBe('true')
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('does not toggle while disabled', async () => {
    const wrapper = mount(EvSwitch, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.attributes('disabled')).toBeDefined()

    const withLabel = mount(EvSwitch, { props: { disabled: true, label: 'Kunci' } })
    await withLabel.trigger('click')
    expect(withLabel.emitted('update:modelValue')).toBeUndefined()
    expect(withLabel.classes()).toContain('ev-switch-wrapper--disabled')
  })

  it('renders the inside label only when text is given', () => {
    expect(mount(EvSwitch).find('.ev-switch__text').exists()).toBe(false)

    const wrapper = mount(EvSwitch, { props: { text: 'ON' } })
    expect(wrapper.classes()).toContain('ev-switch--with-text')
    expect(wrapper.find('.ev-switch__text').text()).toBe('ON')
  })

  it('treats an empty string as no label', () => {
    const wrapper = mount(EvSwitch, { props: { text: '' } })
    expect(wrapper.classes()).not.toContain('ev-switch--with-text')
  })

  it.each(['default', 'small'] as const)('applies the %s size', (size) => {
    expect(mount(EvSwitch, { props: { size } }).classes()).toContain(`ev-switch--${size}`)
  })

  it('applies the error modifier independently of on/off', () => {
    const off = mount(EvSwitch, { props: { error: true } })
    expect(off.classes()).toEqual(expect.arrayContaining(['ev-switch--error', 'ev-switch--off']))

    const on = mount(EvSwitch, { props: { error: true, modelValue: true } })
    expect(on.classes()).toEqual(expect.arrayContaining(['ev-switch--error', 'ev-switch--on']))

    const withLabel = mount(EvSwitch, { props: { error: true, label: 'Error label' } })
    expect(withLabel.classes()).toContain('ev-switch-wrapper--error')
  })

  it('carries the size onto the field so Small can drop its vertical padding', () => {
    expect(mount(EvSwitch, { props: { label: 'A' } }).classes()).toContain(
      'ev-switch-wrapper--default',
    )
    expect(mount(EvSwitch, { props: { label: 'A', size: 'small' } }).classes()).toContain(
      'ev-switch-wrapper--small',
    )
  })
})
