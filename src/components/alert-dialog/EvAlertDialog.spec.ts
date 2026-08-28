import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvAlertDialog from './EvAlertDialog.vue'
import type { AlertDialogVariant } from '../../types'

const VARIANTS: AlertDialogVariant[] = ['success', 'warning', 'confirmation', 'info', 'delete']

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

const openDialog = (props = {}, slots = {}) =>
  mount(EvAlertDialog, { props: { modelValue: true, ...props }, slots, attachTo: document.body })

describe('EvAlertDialog', () => {
  it('renders nothing while closed', () => {
    mount(EvAlertDialog, { props: { modelValue: false } })
    expect(document.querySelector('.ev-alert-dialog')).toBeNull()
  })

  it('is an alertdialog, not a plain dialog', () => {
    openDialog({ title: 'Hapus data?' })
    const panel = document.querySelector('.ev-alert-dialog__panel')!
    expect(panel.getAttribute('role')).toBe('alertdialog')
    expect(panel.getAttribute('aria-modal')).toBe('true')
  })

  it.each(VARIANTS)('applies the %s variant', (variant) => {
    openDialog({ variant })
    expect(document.querySelector(`.ev-alert-dialog__panel--${variant}`)).not.toBeNull()
  })

  it.each(['desktop', 'compact'] as const)('applies the %s layout', (layout) => {
    openDialog({ layout })
    expect(document.querySelector(`.ev-alert-dialog__panel--${layout}`)).not.toBeNull()
  })

  it('ignores a scrim click by default, so the choice stays deliberate', () => {
    const wrapper = openDialog()
    document.querySelector<HTMLElement>('.ev-alert-dialog__scrim')!.click()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes on a scrim click when asked to', () => {
    const wrapper = openDialog({ closeOnScrim: true })
    document.querySelector<HTMLElement>('.ev-alert-dialog__scrim')!.click()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('still closes on Escape', () => {
    const wrapper = openDialog()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('falls back to a built-in glyph, and takes custom media when given', () => {
    openDialog()
    expect(document.querySelector('.ev-alert-dialog__media svg')).not.toBeNull()

    document.body.innerHTML = ''
    openDialog({}, { media: '<img class="art" src="a.svg" />' })
    expect(document.querySelector('.ev-alert-dialog__media img.art')).not.toBeNull()
  })

  it('renders title, description and actions', () => {
    openDialog(
      { title: 'Hapus data?', description: 'Tindakan ini permanen.' },
      { actions: '<button>Hapus</button>' },
    )
    expect(document.querySelector('.ev-alert-dialog__title')!.textContent).toBe('Hapus data?')
    expect(document.querySelector('.ev-alert-dialog__description')!.textContent).toBe(
      'Tindakan ini permanen.',
    )
    expect(document.querySelector('.ev-alert-dialog__actions button')).not.toBeNull()
  })
})
