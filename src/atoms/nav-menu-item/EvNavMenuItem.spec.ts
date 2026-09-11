import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvNavMenuItem from './EvNavMenuItem.vue'

describe('EvNavMenuItem', () => {
  it('takes its shape from its content, as the board does', () => {
    expect(mount(EvNavMenuItem).classes()).toContain('ev-nav-menu-item--text')
    expect(mount(EvNavMenuItem, { slots: { icon: '<i />' } }).classes()).toContain(
      'ev-nav-menu-item--icon-text',
    )
    expect(
      mount(EvNavMenuItem, { props: { iconOnly: true }, slots: { icon: '<i />' } }).classes(),
    ).toContain('ev-nav-menu-item--icon')
  })

  it('marks the current section', () => {
    expect(mount(EvNavMenuItem, { props: { active: true } }).attributes('aria-current')).toBe(
      'page',
    )
  })

  it('is an anchor when given an href', () => {
    expect(mount(EvNavMenuItem, { props: { href: '/a' } }).element.tagName).toBe('A')
    expect(mount(EvNavMenuItem).element.tagName).toBe('BUTTON')
  })
})
