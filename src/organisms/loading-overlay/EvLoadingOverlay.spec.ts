import { afterEach, describe, it, expect } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import EvLoadingOverlay from './EvLoadingOverlay.vue'

// The overlay teleports to <body>, so it is queried there rather than off the wrapper.
let wrapper: VueWrapper | undefined
const mountOverlay = (props: Record<string, unknown> = {}) => {
  wrapper = mount(EvLoadingOverlay, { props, attachTo: document.body })
  return wrapper
}
const q = <T extends Element>(sel: string) => document.body.querySelector<T>(sel)

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('EvLoadingOverlay', () => {
  it('draws nothing until modelValue is true', async () => {
    const w = mountOverlay()
    expect(q('.ev-loading-overlay')).toBeNull()
    await w.setProps({ modelValue: true })
    expect(q('.ev-loading-overlay')).not.toBeNull()
  })

  it('teleports to body, not into its parent', () => {
    const w = mountOverlay({ modelValue: true })
    expect(w.element.querySelector?.('.ev-loading-overlay') ?? null).toBeNull()
    expect(q('body > .ev-loading-overlay')).not.toBeNull()
  })

  it('defaults to blocked: the logo loader over a backdrop', () => {
    mountOverlay({ modelValue: true })
    expect(q('.ev-loading-overlay--blocked')).not.toBeNull()
    expect(q('.ev-loading-overlay__backdrop')).not.toBeNull()
  })

  it('blocked draws the five wordmark paths, in the source order', () => {
    mountOverlay({ modelValue: true, mode: 'blocked' })
    const paths = document.body.querySelectorAll('.ev-loading-overlay__logo-svg path')
    expect(paths).toHaveLength(5)
    expect(q('.ev-loading-overlay__logo-svg')?.getAttribute('viewBox')).toBe('0 0 440.11 106.06')
    for (const path of paths) expect(path.getAttribute('pathLength')).toBe('1000')
    expect(paths[0]?.getAttribute('d')).toMatch(/^m6,96\.79c-2\.21,0-4-1\.79-4-4V7\.69/)
  })

  it('blocked draws logo then backdrop, and no popup card', () => {
    mountOverlay({ modelValue: true, mode: 'blocked' })
    const kids = Array.from(q('.ev-loading-overlay')!.children).map(
      (el) => el.className.split(' ')[0],
    )
    expect(kids).toEqual(['ev-loading-overlay__logo', 'ev-loading-overlay__backdrop'])
    expect(q('.ev-loading-overlay__card')).toBeNull()
  })

  it('popup draws a card holding the spinner, and no logo or backdrop', () => {
    mountOverlay({ modelValue: true, mode: 'popup', label: 'Menyimpan...' })
    expect(q('.ev-loading-overlay--popup')).not.toBeNull()
    expect(q('.ev-loading-overlay__card .ev-loading--spinner')).not.toBeNull()
    expect(q('.ev-loading-overlay__text')?.textContent).toBe('Menyimpan...')
    expect(q('.ev-loading-overlay__logo')).toBeNull()
    expect(q('.ev-loading-overlay__backdrop')).toBeNull()
  })

  it('announces itself as busy and labels the blocked loader', () => {
    mountOverlay({ modelValue: true, label: 'Memuat data' })
    expect(q('.ev-loading-overlay')?.getAttribute('aria-busy')).toBe('true')
    const logo = q('.ev-loading-overlay__logo')
    expect(logo?.getAttribute('role')).toBe('status')
    expect(logo?.getAttribute('aria-label')).toBe('Memuat data')
  })

  it('follows modelValue back to nothing', async () => {
    const w = mountOverlay({ modelValue: true })
    await w.setProps({ modelValue: false })
    expect(q('.ev-loading-overlay')).toBeNull()
  })

  it('closes on Escape only when closeOnEscape is set', async () => {
    const off = mountOverlay({ modelValue: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(off.emitted('update:modelValue')).toBeUndefined()
    off.unmount()

    const on = mountOverlay({ modelValue: true, closeOnEscape: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(on.emitted('update:modelValue')?.[0]).toEqual([false])
  })
})
