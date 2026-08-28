import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTooltip from './EvTooltip.vue'
import type { TooltipPlacement } from '../../types'

const PLACEMENTS: TooltipPlacement[] = ['top', 'bottom', 'left', 'right']

/** `v-show` hides by style, so the element is present either way. */
const isHidden = (el: Element) => (el as HTMLElement).style.display === 'none'

describe('EvTooltip', () => {
  it('starts hidden and shows on hover', async () => {
    const wrapper = mount(EvTooltip, { props: { text: 'Penjelasan' } })
    const bubble = wrapper.find('.ev-tooltip__bubble')
    expect(isHidden(bubble.element)).toBe(true)

    await wrapper.trigger('mouseenter')
    expect(isHidden(bubble.element)).toBe(false)

    await wrapper.trigger('mouseleave')
    expect(isHidden(bubble.element)).toBe(true)
  })

  it('shows on focus, so keyboard users get it too', async () => {
    const wrapper = mount(EvTooltip, { props: { text: 'Penjelasan' } })
    await wrapper.trigger('focusin')
    expect(isHidden(wrapper.find('.ev-tooltip__bubble').element)).toBe(false)
  })

  it('describes the trigger only while visible', async () => {
    const wrapper = mount(EvTooltip, { props: { text: 'Penjelasan' } })
    const trigger = wrapper.find('.ev-tooltip__trigger')
    expect(trigger.attributes('aria-describedby')).toBeUndefined()

    await wrapper.trigger('mouseenter')
    expect(trigger.attributes('aria-describedby')).toBe(
      wrapper.find('.ev-tooltip__bubble').attributes('id'),
    )
  })

  it('is a tooltip role carrying its text', () => {
    const wrapper = mount(EvTooltip, { props: { text: 'Penjelasan' } })
    const bubble = wrapper.find('.ev-tooltip__bubble')
    expect(bubble.attributes('role')).toBe('tooltip')
    expect(wrapper.find('.ev-tooltip__body').text()).toBe('Penjelasan')
  })

  it.each(PLACEMENTS)('applies the %s placement', (placement) => {
    const wrapper = mount(EvTooltip, { props: { placement } })
    expect(wrapper.find('.ev-tooltip__bubble').classes()).toContain(
      `ev-tooltip__bubble--${placement}`,
    )
  })

  it('hands control over when `open` is passed', async () => {
    const wrapper = mount(EvTooltip, { props: { open: false, text: 'x' } })
    await wrapper.trigger('mouseenter')

    // Hover must not open it - the parent owns visibility now.
    expect(isHidden(wrapper.find('.ev-tooltip__bubble').element)).toBe(true)
    expect(wrapper.emitted('update:open')).toEqual([[true]])
  })

  it('renders the title row only when it has something in it', () => {
    expect(mount(EvTooltip).find('.ev-tooltip__title-row').exists()).toBe(false)
    expect(
      mount(EvTooltip, { props: { title: 'Judul' } })
        .find('.ev-tooltip__title')
        .text(),
    ).toBe('Judul')
  })

  it('closes from the dismiss button', async () => {
    const wrapper = mount(EvTooltip, { props: { dismissible: true } })
    await wrapper.trigger('mouseenter')
    await wrapper.find('.ev-tooltip__close').trigger('click')
    expect(isHidden(wrapper.find('.ev-tooltip__bubble').element)).toBe(true)
  })

  it('renders the footer slot only when filled', () => {
    expect(mount(EvTooltip).find('.ev-tooltip__footer').exists()).toBe(false)
    const wrapper = mount(EvTooltip, { slots: { footer: 'Langkah 1 dari 5' } })
    expect(wrapper.find('.ev-tooltip__footer').text()).toBe('Langkah 1 dari 5')
  })

  it("renders Figma's Slot Title as the leading tile of the title row", () => {
    expect(mount(EvTooltip).find('.ev-tooltip__slot-title').exists()).toBe(false)

    const wrapper = mount(EvTooltip, { slots: { slotTitle: '<i>i</i>', title: 'Judul' } })
    const row = wrapper.find('.ev-tooltip__title-row')
    const order = Array.from(row.element.children).map((el) => (el as Element).className)
    expect(order[0]).toBe('ev-tooltip__slot-title')
    expect(order[1]).toBe('ev-tooltip__title')
  })

  it("renders Figma's Slot Content between the message and the footer", () => {
    expect(mount(EvTooltip).find('.ev-tooltip__slot-content').exists()).toBe(false)

    const wrapper = mount(EvTooltip, {
      props: { text: 'Pesan' },
      slots: { slotContent: 'Tambahan', footer: 'Langkah 1 dari 5' },
    })
    const panel = wrapper.find('.ev-tooltip__panel')
    const order = Array.from(panel.element.children).map((el) => (el as Element).className)
    expect(order).toEqual(['ev-tooltip__body', 'ev-tooltip__slot-content', 'ev-tooltip__footer'])
  })
})
