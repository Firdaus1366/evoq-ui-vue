import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvModal from './EvModal.vue'

/** Teleported markup lands on `body`, so each test cleans up after itself. */
afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

const openModal = (props = {}, slots = {}) =>
  mount(EvModal, { props: { modelValue: true, ...props }, slots, attachTo: document.body })

describe('EvModal', () => {
  it('renders nothing while closed', () => {
    mount(EvModal, { props: { modelValue: false } })
    expect(document.querySelector('.ev-modal')).toBeNull()
  })

  it('is a modal dialog when open', () => {
    openModal({ title: 'Konfirmasi' })
    const panel = document.querySelector('.ev-modal__panel')!
    expect(panel.getAttribute('role')).toBe('dialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
  })

  it('labels itself with its own title', () => {
    openModal({ title: 'Konfirmasi' })
    const panel = document.querySelector('.ev-modal__panel')!
    const title = document.querySelector('.ev-modal__title')!
    expect(panel.getAttribute('aria-labelledby')).toBe(title.id)
    expect(title.textContent).toBe('Konfirmasi')
  })

  it.each(['small', 'medium', 'large'] as const)('applies the %s size', (size) => {
    openModal({ size })
    expect(document.querySelector(`.ev-modal__panel--${size}`)).not.toBeNull()
  })

  it('closes from the close button', async () => {
    const wrapper = openModal()
    await wrapper.vm.$nextTick()
    document.querySelector<HTMLButtonElement>('.ev-modal__close')!.click()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes on a scrim click, and not when told otherwise', () => {
    const closes = openModal()
    document.querySelector<HTMLElement>('.ev-modal__scrim')!.click()
    expect(closes.emitted('update:modelValue')).toEqual([[false]])

    document.body.innerHTML = ''
    const stays = openModal({ closeOnScrim: false })
    document.querySelector<HTMLElement>('.ev-modal__scrim')!.click()
    expect(stays.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes on Escape', () => {
    const wrapper = openModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('holds the page behind still while open, and lets go on close', async () => {
    const wrapper = openModal()
    expect(document.body.style.overflow).toBe('hidden')

    await wrapper.setProps({ modelValue: false })
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('omits the close button when not closable', () => {
    openModal({ closable: false })
    expect(document.querySelector('.ev-modal__close')).toBeNull()
  })

  it('renders the footer only when something fills it', () => {
    openModal()
    expect(document.querySelector('.ev-modal__footer')).toBeNull()

    document.body.innerHTML = ''
    openModal({}, { footer: '<button>Simpan</button>' })
    expect(document.querySelector('.ev-modal__footer button')).not.toBeNull()
  })

  it('renders the leading footer slot beside the actions', () => {
    openModal({}, { footerStart: '<span class="fs">Jangan tampilkan lagi</span>' })
    expect(document.querySelector('.ev-modal__footer-start .fs')).not.toBeNull()
  })
})
