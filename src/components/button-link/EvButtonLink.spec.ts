import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvButtonLink from './EvButtonLink.vue'
import type { ButtonLinkVariant } from '../../types'

const VARIANTS: ButtonLinkVariant[] = ['primary', 'secondary', 'tertiary', 'invert', 'custom']

describe('EvButtonLink', () => {
  it('is a button when no href is given', () => {
    const wrapper = mount(EvButtonLink, { slots: { default: 'Lihat' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Lihat')
  })

  it('is an anchor when an href is given', () => {
    const wrapper = mount(EvButtonLink, { props: { href: '/laporan' } })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/laporan')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('falls back to a button when a link is disabled, so it stays focusable', () => {
    const wrapper = mount(EvButtonLink, { props: { href: '/x', disabled: true } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('href')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
  })

  it.each(VARIANTS)('applies the %s variant class', (variant) => {
    expect(mount(EvButtonLink, { props: { variant } }).classes()).toContain(
      `ev-button-link--${variant}`,
    )
  })

  it('emits click when enabled', async () => {
    const wrapper = mount(EvButtonLink)
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(EvButtonLink, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})
