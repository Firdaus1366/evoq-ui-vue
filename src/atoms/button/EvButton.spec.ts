import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvButton from './EvButton.vue'
import type { ButtonVariant } from '../../types'

/** Every `Variant` option of the Figma component set. */
const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary-light',
  'secondary-grey',
  'secondary-white',
  'destructive',
  'outline',
  'ghost',
]

describe('EvButton', () => {
  it('renders its default slot', () => {
    const wrapper = mount(EvButton, { slots: { default: 'Simpan' } })
    expect(wrapper.text()).toBe('Simpan')
  })

  it('defaults to the primary variant at the default size', () => {
    const wrapper = mount(EvButton)
    expect(wrapper.classes()).toContain('ev-button--primary')
    expect(wrapper.classes()).toContain('ev-button--default')
  })

  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    const wrapper = mount(EvButton, { props: { variant } })
    expect(wrapper.classes()).toContain(`ev-button--${variant}`)
  })

  it('applies the small size class', () => {
    const wrapper = mount(EvButton, { props: { size: 'small' } })
    expect(wrapper.classes()).toContain('ev-button--small')
  })

  it('emits click when enabled', async () => {
    const wrapper = mount(EvButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click while loading', async () => {
    const wrapper = mount(EvButton, { props: { loading: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(EvButton, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('drops the label wrapper when icon only', () => {
    const wrapper = mount(EvButton, {
      props: { iconOnly: true },
      slots: { iconLeft: '<svg />', default: 'hidden' },
    })
    expect(wrapper.classes()).toContain('ev-button--icon-only')
    expect(wrapper.find('.ev-button__label').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('hidden')
  })

  it('keeps the label wrapper otherwise', () => {
    const wrapper = mount(EvButton, { slots: { default: 'Simpan' } })
    expect(wrapper.find('.ev-button__label').text()).toBe('Simpan')
  })

  it('forwards unknown attributes to the root button', () => {
    const wrapper = mount(EvButton, { attrs: { 'data-testid': 'save' } })
    expect(wrapper.attributes('data-testid')).toBe('save')
  })
})
