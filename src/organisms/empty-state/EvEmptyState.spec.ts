import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvEmptyState from './EvEmptyState.vue'
import EvButton from '../../atoms/button/EvButton.vue'
import type { EmptyStateVariant } from '../../types'

const PAGE: EmptyStateVariant[] = ['400', '401', '404', '500', 'maintenance']
const INLINE: EmptyStateVariant[] = ['no-data', 'no-result']

describe('EvEmptyState', () => {
  it.each([...PAGE, ...INLINE])('carries the board copy for %s', (variant) => {
    const wrapper = mount(EvEmptyState, { props: { variant } })
    expect(wrapper.find('.ev-empty-state__title').text().length).toBeGreaterThan(0)
  })

  it('writes the 404 copy the board writes', () => {
    const wrapper = mount(EvEmptyState, { props: { variant: '404' } })
    expect(wrapper.find('.ev-empty-state__title').text()).toBe("This Page isn't Available")
    expect(wrapper.findComponent(EvButton).text()).toBe('Go Back')
  })

  // Board order: illustration, copy, Button.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvEmptyState, { props: { variant: '404', errorMessage: 'E-404' } })
    const parts = Array.from(wrapper.element.children).map(
      (el) => (el as Element).className.split(' ')[0],
    )
    expect(parts).toEqual([
      'ev-empty-state__illustration',
      'ev-empty-state__copy',
      'ev-empty-state__button',
    ])
  })

  // 400 and 401 draw four rings; 404, 500 and Under Maintenance draw three.
  it.each([
    ['400', 4],
    ['401', 4],
    ['404', 3],
    ['500', 3],
    ['maintenance', 3],
  ] as const)('draws %s with %i rings', (variant, count) => {
    const wrapper = mount(EvEmptyState, { props: { variant } })
    expect(wrapper.findAll('.ev-empty-state__ring')).toHaveLength(count)
  })

  it.each(INLINE)('draws %s with no rings and no button', (variant) => {
    const wrapper = mount(EvEmptyState, { props: { variant } })
    expect(wrapper.classes()).toContain('ev-empty-state--inline')
    expect(wrapper.findAll('.ev-empty-state__ring')).toHaveLength(0)
    expect(wrapper.findComponent(EvButton).exists()).toBe(false)
    expect(wrapper.find('.ev-empty-state__description').exists()).toBe(false)
  })

  it('composes a secondary-light EvButton rather than redrawing one', () => {
    const button = mount(EvEmptyState, { props: { variant: '500' } }).findComponent(EvButton)
    expect(button.props('variant')).toBe('secondary-light')
    expect(button.props('size')).toBe('default')
    expect(button.props('block')).toBe(false)
  })

  it('stretches the button on the mobile board', () => {
    const wrapper = mount(EvEmptyState, { props: { variant: '404', size: 'mobile' } })
    expect(wrapper.classes()).toContain('ev-empty-state--mobile')
    expect(wrapper.findComponent(EvButton).props('block')).toBe(true)
  })

  it('emits action when the button is pressed', async () => {
    const wrapper = mount(EvEmptyState, { props: { variant: '404' } })
    await wrapper.findComponent(EvButton).trigger('click')
    expect(wrapper.emitted('action')).toHaveLength(1)
  })

  it('drops the button when the label is cleared', () => {
    const wrapper = mount(EvEmptyState, { props: { variant: '404', actionLabel: '' } })
    expect(wrapper.findComponent(EvButton).exists()).toBe(false)
  })

  it('lets the action slot replace the button', () => {
    const wrapper = mount(EvEmptyState, {
      props: { variant: '404' },
      slots: { action: '<a class="custom">Kembali</a>' },
    })
    expect(wrapper.findComponent(EvButton).exists()).toBe(false)
    expect(wrapper.find('.custom').exists()).toBe(true)
  })

  it('overrides the copy when asked', () => {
    const wrapper = mount(EvEmptyState, {
      props: { variant: '404', title: 'Tidak ketemu', description: 'Coba lagi' },
    })
    expect(wrapper.find('.ev-empty-state__title').text()).toBe('Tidak ketemu')
    expect(wrapper.find('.ev-empty-state__description').text()).toBe('Coba lagi')
  })

  it('draws the error line only when given one', () => {
    expect(
      mount(EvEmptyState, { props: { variant: '404' } })
        .find('.ev-empty-state__error')
        .exists(),
    ).toBe(false)
    const wrapper = mount(EvEmptyState, { props: { variant: '404', errorMessage: 'E-404' } })
    expect(wrapper.find('.ev-empty-state__error').text()).toBe('E-404')
  })

  // The centrepiece is artwork, so it is a slot with a neutral default.
  it('lets the illustration slot replace the centre art', () => {
    const wrapper = mount(EvEmptyState, {
      props: { variant: '404' },
      slots: { illustration: '<svg class="custom-art" />' },
    })
    expect(wrapper.find('.custom-art').exists()).toBe(true)
    expect(wrapper.find('.ev-empty-state__badge').exists()).toBe(false)
    // The rings belong to the frame, not the art, so they stay.
    expect(wrapper.findAll('.ev-empty-state__ring')).toHaveLength(3)
  })
})
