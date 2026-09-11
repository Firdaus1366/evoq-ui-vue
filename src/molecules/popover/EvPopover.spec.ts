import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvPopover from './EvPopover.vue'
import type { TooltipPlacement } from '../../types'

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

/** `v-show` hides by style, so the panel is in the DOM either way. */
const isHidden = (el: Element) => (el as HTMLElement).style.display === 'none'

describe('EvPopover', () => {
  it('starts closed', () => {
    const wrapper = mount(EvPopover)
    expect(isHidden(wrapper.find('.ev-popover__panel').element)).toBe(true)
  })

  it('is a dialog that does not block the page', () => {
    const wrapper = mount(EvPopover, { props: { modelValue: true }, attachTo: document.body })
    expect(wrapper.find('.ev-popover__panel').attributes('role')).toBe('dialog')

    // A popover is not modal, so it must not lock scrolling.
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('hands the trigger slot an open flag and a toggle', async () => {
    const wrapper = mount(EvPopover, {
      slots: {
        trigger: `<template #trigger="{ open, toggle }">
          <button class="t" :data-open="open" @click="toggle">Buka</button>
        </template>`,
      },
    })
    const button = wrapper.find('button.t')
    expect(button.attributes('data-open')).toBe('false')

    await button.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it.each(['top', 'bottom', 'left', 'right'] as TooltipPlacement[])(
    'applies the %s placement',
    (placement) => {
      const wrapper = mount(EvPopover, { props: { placement } })
      expect(wrapper.find('.ev-popover__panel').classes()).toContain(
        `ev-popover__panel--${placement}`,
      )
    },
  )

  it('closes on a click beyond its own subtree', () => {
    const wrapper = mount(EvPopover, { props: { modelValue: true }, attachTo: document.body })
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('stays open for a click inside itself', () => {
    const wrapper = mount(EvPopover, {
      props: { modelValue: true },
      slots: { default: '<button class="inner">Simpan</button>' },
      attachTo: document.body,
    })
    const inner = wrapper.find('button.inner').element
    inner.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('honours closeOnOutside: false', () => {
    const wrapper = mount(EvPopover, {
      props: { modelValue: true, closeOnOutside: false },
      attachTo: document.body,
    })
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('closes on Escape', () => {
    const wrapper = mount(EvPopover, { props: { modelValue: true }, attachTo: document.body })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('renders title, description and footer', () => {
    const wrapper = mount(EvPopover, {
      props: { modelValue: true, title: 'Ubah dimensi', description: 'Atur ukuran' },
      slots: { footer: '<button>Simpan</button>' },
    })
    expect(wrapper.find('.ev-popover__title').text()).toBe('Ubah dimensi')
    expect(wrapper.find('.ev-popover__description').text()).toBe('Atur ukuran')
    expect(wrapper.find('.ev-popover__footer button').exists()).toBe(true)
  })

  it('omits the heading entirely when there is none', () => {
    const wrapper = mount(EvPopover, { props: { modelValue: true } })
    expect(wrapper.find('.ev-popover__heading').exists()).toBe(false)
  })
})
