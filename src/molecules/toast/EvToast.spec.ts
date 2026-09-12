import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvToast from './EvToast.vue'
import type { ToastVariant } from '../../types'

const VARIANTS: ToastVariant[] = [
  'default',
  'success',
  'error',
  'warning',
  'info',
  'with-description',
]

describe('EvToast', () => {
  it('is a polite status by default', () => {
    const wrapper = mount(EvToast, { props: { title: 'Tersimpan' } })
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-live')).toBe('polite')
    expect(wrapper.classes()).toContain('ev-toast--default')
    expect(wrapper.classes()).toContain('ev-toast--inline')
    expect(wrapper.find('.ev-toast__title').text()).toBe('Tersimpan')
  })

  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    expect(mount(EvToast, { props: { variant } }).classes()).toContain(`ev-toast--${variant}`)
  })

  // The board gives a status icon to the four semantic variants only.
  it.each(['success', 'error', 'warning', 'info'] as const)('draws a %s status icon', (variant) => {
    const wrapper = mount(EvToast, { props: { variant } })
    expect(wrapper.find('.ev-toast__icon').exists()).toBe(true)
    expect(wrapper.classes()).toContain('ev-toast--with-icon')
  })

  it('draws no status icon on the default variant', () => {
    expect(mount(EvToast).find('.ev-toast__icon').exists()).toBe(false)
  })

  it('stacks when given a description, and on the WithDescription variant', () => {
    const byProp = mount(EvToast, { props: { title: 'A', description: 'B' } })
    expect(byProp.classes()).toContain('ev-toast--stacked')
    expect(byProp.find('.ev-toast__description').text()).toBe('B')

    const byVariant = mount(EvToast, { props: { variant: 'with-description' } })
    expect(byVariant.classes()).toContain('ev-toast--stacked')
  })

  it('has no description node in the inline layout', () => {
    expect(mount(EvToast).find('.ev-toast__description').exists()).toBe(false)
  })

  /*
   * Deviation, asserted so it cannot drift back: the board nests the close
   * glyph inside Content on the semantic variants. One flat order is used, so
   * the dismiss control's place in the a11y tree does not move with the icon.
   */
  it('keeps the close button a sibling of the content, icon or not', () => {
    for (const variant of ['default', 'success'] as const) {
      const wrapper = mount(EvToast, { props: { variant } })
      expect(wrapper.find('.ev-toast__content .ev-toast__close').exists()).toBe(false)
      const parts = Array.from(wrapper.element.children).map((el) => (el as Element).className)
      expect(parts.at(-1)).toBe('ev-toast__close')
    }
  })

  it('emits close from the dismiss button', async () => {
    const wrapper = mount(EvToast, { props: { closeLabel: 'Tutup pesan' } })
    const close = wrapper.find('.ev-toast__close')
    expect(close.attributes('aria-label')).toBe('Tutup pesan')
    await close.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  // WithDescription puts a Button where the close cross would be.
  it('drops the close cross when the actions slot is filled', () => {
    const wrapper = mount(EvToast, { slots: { actions: '<button>Undo</button>' } })
    expect(wrapper.find('.ev-toast__actions').exists()).toBe(true)
    expect(wrapper.find('.ev-toast__close').exists()).toBe(false)
  })

  it('drops the close cross when not dismissible', () => {
    expect(
      mount(EvToast, { props: { dismissible: false } })
        .find('.ev-toast__close')
        .exists(),
    ).toBe(false)
  })
})
