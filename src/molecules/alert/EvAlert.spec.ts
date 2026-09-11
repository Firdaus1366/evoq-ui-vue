import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvAlert from './EvAlert.vue'
import type { AlertVariant } from '../../types'

const VARIANTS: AlertVariant[] = ['neutral', 'neutral-dark', 'info', 'success', 'error', 'warning']

describe('EvAlert', () => {
  it('is a neutral inline alert by default', () => {
    const wrapper = mount(EvAlert, { props: { title: 'Tersimpan' } })
    expect(wrapper.attributes('role')).toBe('alert')
    expect(wrapper.classes()).toContain('ev-alert--neutral')
    expect(wrapper.classes()).toContain('ev-alert--inline')
    expect(wrapper.find('.ev-alert__title').text()).toBe('Tersimpan')
  })

  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    expect(mount(EvAlert, { props: { variant } }).classes()).toContain(`ev-alert--${variant}`)
  })

  it('switches to the stacked layout when a subtext is given', () => {
    const wrapper = mount(EvAlert, { props: { title: 'Gagal', subtext: 'Coba lagi' } })
    expect(wrapper.classes()).toContain('ev-alert--stacked')
    expect(wrapper.find('.ev-alert__subtext').text()).toBe('Coba lagi')
  })

  it('treats a subtext slot the same as the prop', () => {
    const wrapper = mount(EvAlert, { slots: { subtext: 'Dari slot' } })
    expect(wrapper.classes()).toContain('ev-alert--stacked')
  })

  it('has no subtext element in the inline layout', () => {
    expect(mount(EvAlert).find('.ev-alert__subtext').exists()).toBe(false)
  })

  it('applies inverse to the semantic variants', () => {
    const wrapper = mount(EvAlert, { props: { variant: 'success', inverse: true } })
    expect(wrapper.classes()).toContain('ev-alert--inverse')
  })

  it.each(['neutral', 'neutral-dark'] as const)(
    'ignores inverse on %s, which is not a tinted surface',
    (variant) => {
      const wrapper = mount(EvAlert, { props: { variant, inverse: true } })
      expect(wrapper.classes()).not.toContain('ev-alert--inverse')
    },
  )

  it('renders the dismiss button only when dismissible', async () => {
    expect(mount(EvAlert).find('.ev-alert__close').exists()).toBe(false)

    const wrapper = mount(EvAlert, { props: { dismissible: true, closeLabel: 'Tutup pesan' } })
    const close = wrapper.find('.ev-alert__close')
    expect(close.attributes('aria-label')).toBe('Tutup pesan')
    await close.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('renders the actions slot only when filled', () => {
    expect(mount(EvAlert).find('.ev-alert__actions').exists()).toBe(false)
    const wrapper = mount(EvAlert, { slots: { actions: '<button>Ok</button>' } })
    expect(wrapper.find('.ev-alert__actions').exists()).toBe(true)
  })

  it('renders the link slot below the message and switches to stacked layout', () => {
    expect(mount(EvAlert).find('.ev-alert__link').exists()).toBe(false)
    const wrapper = mount(EvAlert, {
      props: { title: 'Pemberitahuan' },
      slots: { link: '<a href="#">Pelajari lebih lanjut</a>' },
    })
    expect(wrapper.classes()).toContain('ev-alert--stacked')
    expect(wrapper.find('.ev-alert__link a').text()).toBe('Pelajari lebih lanjut')
  })
})
