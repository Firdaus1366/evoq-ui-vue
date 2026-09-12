import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import EvLogo from './EvLogo.vue'
import { LOCKUPS } from './lockups'

/** Figma: EVOQ-Logo is 681.09x194, so the lockup is this many times its height. */
const EVOQ_RATIO = (681.09 / 194).toFixed(4)

describe('EvLogo', () => {
  it('draws the whole EVOQ lockup - mark, wordmark and tagline', () => {
    const wrapper = mount(EvLogo)
    const parts = wrapper.findAll('.ev-logo__part')

    expect(parts.map((p) => p.classes().at(-1))).toEqual([
      'ev-logo__mark',
      'ev-logo__wordmark',
      'ev-logo__tagline',
    ])
    // Each part is the exported Figma SVG, not a placeholder.
    expect(parts.every((p) => p.find('svg[viewBox]').exists())).toBe(true)
  })

  it('places the parts where the board places them', () => {
    const wrapper = mount(EvLogo)
    expect(wrapper.attributes('style')).toContain(`width: ${EVOQ_RATIO}em`)

    const [mark, wordmark] = wrapper.findAll('.ev-logo__part')
    expect(mark!.attributes('style')).toContain('left: 0em')
    expect(mark!.attributes('style')).toContain('width: 1em')
    // The wordmark starts at x 223.75 of a 194-tall lockup.
    expect(wordmark!.attributes('style')).toContain(`left: ${(223.75 / 194).toFixed(4)}em`)
  })

  it('drops the tagline on request, and never draws one DataSea has not got', () => {
    const noTagline = mount(EvLogo, { props: { tagline: false } })
    expect(noTagline.find('.ev-logo__tagline').exists()).toBe(false)
    expect(noTagline.findAll('.ev-logo__part')).toHaveLength(2)

    const datasea = mount(EvLogo, { props: { brand: 'datasea', tagline: true } })
    expect(datasea.findAll('.ev-logo__part')).toHaveLength(2)
    expect(datasea.find('.ev-logo__tagline').exists()).toBe(false)
  })

  it('draws one part on its own, in its own square box', () => {
    const mark = mount(EvLogo, { props: { variant: 'mark' } })
    expect(mark.findAll('.ev-logo__part')).toHaveLength(1)
    expect(mark.attributes('style')).toContain('width: 1em')

    const wordmark = mount(EvLogo, { props: { variant: 'wordmark' } })
    expect(wordmark.findAll('.ev-logo__part')).toHaveLength(1)
    expect(wordmark.find('.ev-logo__wordmark').attributes('style')).toContain('left: 0em')
  })

  it('names itself for assistive tech, per brand', () => {
    expect(mount(EvLogo).attributes('aria-label')).toBe('EVOQ')
    expect(mount(EvLogo, { props: { brand: 'datasea' } }).attributes('aria-label')).toBe('DataSea')
    expect(mount(EvLogo).attributes('role')).toBe('img')
  })

  it('hides itself when the label is cleared, for decorative use', () => {
    const wrapper = mount(EvLogo, { props: { label: '' } })
    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('takes a numeric size as pixels and a string verbatim', () => {
    expect(mount(EvLogo, { props: { size: 48 } }).attributes('style')).toContain('font-size: 48px')
    expect(mount(EvLogo, { props: { size: '3rem' } }).attributes('style')).toContain(
      'font-size: 3rem',
    )
  })

  it('uses a local asset instead of the Figma logo when given one', () => {
    const wrapper = mount(EvLogo, { props: { src: '/brand/acme.svg' } })
    const img = wrapper.find('img.ev-logo__image')

    expect(img.attributes('src')).toBe('/brand/acme.svg')
    expect(img.attributes('alt')).toBe('EVOQ')
    expect(wrapper.findAll('.ev-logo__part')).toHaveLength(0)
    // An override brings its own ratio, so the lockup's box is not imposed.
    expect(wrapper.attributes('style')).not.toContain('width:')
  })

  it('lets a slot replace the logo entirely, over src', () => {
    const wrapper = mount(EvLogo, {
      props: { src: '/brand/acme.svg' },
      slots: { default: '<span class="own">Acme</span>' },
    })

    expect(wrapper.find('.own').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.findAll('.ev-logo__part')).toHaveLength(0)
    expect(wrapper.attributes('role')).toBeUndefined()
  })

  it('scopes the gradient ids so two logos on one page cannot collide', () => {
    // One app, two logos - which is the case the shared Figma ids would break.
    const page = mount(
      defineComponent({ components: { EvLogo }, template: '<div><EvLogo /><EvLogo /></div>' }),
    )
    const [first, second] = page.findAllComponents(EvLogo).map((c) => c.html())
    const ids = (html: string) => [...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1])

    expect(ids(first!).length).toBeGreaterThan(0)
    expect(ids(first!)).not.toEqual(ids(second!))
    // Every reference still points at an id its own instance defines.
    for (const html of [first!, second!]) {
      for (const [, ref] of html.matchAll(/url\(#([^)]+)\)/g)) expect(html).toContain(`id="${ref}"`)
    }
  })
  /*
   * Figma's own export of the whole EVOQ lockup starts its shapes here, in
   * lockup units. Composing the parts has to land on the same coordinates -
   * this is what catches a re-exported asset whose ink bounds moved.
   */
  it('composes the lockup on the coordinates Figma exports it at', () => {
    const FIGMA_STARTS: [number, number][] = [
      [97, 97], // the mark's circle
      [98.5, 0],
      [59.7, 7.5],
      [122.1, 3.3],
      [85.5, 0.7],
      [32.3, 24.7],
      [34.5, 171.2],
      [224.3, 165.9], // the tagline
      [227.9, 117.5], // the wordmark
      [325.7, 19.9],
      [496.5, 68.7],
      [552.7, 89.2],
      [646.4, 78.9],
    ]

    const placed: [number, number][] = []
    for (const part of Object.values(LOCKUPS.evoq.parts)) {
      if (!part) continue
      const points = [
        ...part.svg.matchAll(/<path[^>]*\sd="M(-?[\d.]+)[ ,](-?[\d.]+)/g),
        ...part.svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g),
      ]
      for (const [, x, y] of points) placed.push([Number(x) + part.x, Number(y) + part.y])
    }

    for (const [x, y] of FIGMA_STARTS) {
      const hit = placed.some(([px, py]) => Math.abs(px - x) <= 0.11 && Math.abs(py - y) <= 0.11)
      expect(hit, `nothing is drawn at ${x},${y}`).toBe(true)
    }
  })
})
