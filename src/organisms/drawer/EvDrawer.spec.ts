import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvDrawer from './EvDrawer.vue'
import type { DrawerPlacement, DrawerSize } from '../../types'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

const openDrawer = (props = {}, slots = {}) =>
  mount(EvDrawer, { props: { modelValue: true, ...props }, slots, attachTo: document.body })

describe('EvDrawer', () => {
  it('renders nothing while closed', () => {
    mount(EvDrawer, { props: { modelValue: false } })
    expect(document.querySelector('.ev-drawer')).toBeNull()
  })

  it('is a modal dialog labelled by its title', () => {
    openDrawer({ title: 'Filter' })
    const panel = document.querySelector('.ev-drawer__panel')!
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
    expect(panel.getAttribute('aria-labelledby')).toBe(
      document.querySelector('.ev-drawer__title')!.id,
    )
  })

  it.each(['right', 'left', 'bottom'] as DrawerPlacement[])('slides from the %s', (placement) => {
    openDrawer({ placement })
    expect(document.querySelector(`.ev-drawer--${placement}`)).not.toBeNull()
  })

  it.each(['default', 'wide'] as DrawerSize[])('applies the %s size', (size) => {
    openDrawer({ size })
    expect(document.querySelector(`.ev-drawer__panel--${size}`)).not.toBeNull()
  })

  it('gives only the bottom sheet a grab handle', () => {
    openDrawer({ placement: 'bottom' })
    expect(document.querySelector('.ev-drawer__thumb')).not.toBeNull()

    document.body.innerHTML = ''
    openDrawer({ placement: 'right' })
    expect(document.querySelector('.ev-drawer__thumb')).toBeNull()
  })

  it('closes from the close button, the scrim and Escape', () => {
    const byButton = openDrawer()
    document.querySelector<HTMLButtonElement>('.ev-drawer__close')!.click()
    expect(byButton.emitted('update:modelValue')).toEqual([[false]])

    document.body.innerHTML = ''
    const byScrim = openDrawer()
    document.querySelector<HTMLElement>('.ev-drawer__scrim')!.click()
    expect(byScrim.emitted('update:modelValue')).toEqual([[false]])

    document.body.innerHTML = ''
    const byEscape = openDrawer()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(byEscape.emitted('update:modelValue')).toEqual([[false]])
  })

  it('locks the page behind it', async () => {
    const wrapper = openDrawer()
    expect(document.body.style.overflow).toBe('hidden')
    await wrapper.setProps({ modelValue: false })
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('renders the footer only when filled', () => {
    openDrawer()
    expect(document.querySelector('.ev-drawer__footer')).toBeNull()

    document.body.innerHTML = ''
    openDrawer({}, { footer: '<button>Terapkan</button>' })
    expect(document.querySelector('.ev-drawer__footer button')).not.toBeNull()
  })
})
