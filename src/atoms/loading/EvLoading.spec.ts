import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvLoading from './EvLoading.vue'
import type { LoadingType } from '../../types'

const TYPES: LoadingType[] = ['spinner', 'pulse', 'progress-bar', 'skeleton']

describe('EvLoading', () => {
  it('is a spinner by default and announces itself', () => {
    const wrapper = mount(EvLoading)
    expect(wrapper.classes()).toContain('ev-loading--spinner')
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('Memuat...')
  })

  it.each(TYPES)('applies the %s type class', (type) => {
    expect(mount(EvLoading, { props: { type } }).classes()).toContain(`ev-loading--${type}`)
  })

  // The board draws three concentric half-rings, outer to inner.
  it('draws the spinner as three rings in board order', () => {
    const arcs = mount(EvLoading).findAll('.ev-loading__arc')
    expect(arcs).toHaveLength(3)
    expect(arcs.map((a) => a.classes()[1])).toEqual([
      'ev-loading__arc--outer',
      'ev-loading__arc--middle',
      'ev-loading__arc--inner',
    ])
    expect(arcs.map((a) => a.attributes('r'))).toEqual(['19', '12', '4'])
  })

  // Dots 4, 3, 2, 1 - north, south, west, east - as the board stacks them.
  it('draws four pulse dots on the compass points', () => {
    const wrapper = mount(EvLoading, { props: { type: 'pulse' } })
    const dots = wrapper.findAll('.ev-loading__dot')
    expect(dots).toHaveLength(4)
    expect(dots.map((d) => d.classes()[1])).toEqual([
      'ev-loading__dot--top',
      'ev-loading__dot--bottom',
      'ev-loading__dot--left',
      'ev-loading__dot--right',
    ])
    expect(dots.map((d) => `${d.attributes('cx')},${d.attributes('cy')}`)).toEqual([
      '24,14',
      '24,34',
      '14,24',
      '34,24',
    ])
  })

  it('runs the progress bar indeterminate until a value is given', () => {
    const loose = mount(EvLoading, { props: { type: 'progress-bar' } })
    expect(loose.find('.ev-loading__value').classes()).toContain('ev-loading__value--indeterminate')
    expect(loose.attributes('aria-valuenow')).toBeUndefined()

    const fixed = mount(EvLoading, { props: { type: 'progress-bar', value: 40 } })
    const bar = fixed.find('.ev-loading__value')
    expect(bar.classes()).not.toContain('ev-loading__value--indeterminate')
    expect(bar.attributes('style')).toContain('width: 40%')
    expect(fixed.attributes('aria-valuenow')).toBe('40')
  })

  it('clamps the progress value to 0..100', () => {
    const over = mount(EvLoading, { props: { type: 'progress-bar', value: 140 } })
    expect(over.find('.ev-loading__value').attributes('style')).toContain('width: 100%')
    const under = mount(EvLoading, { props: { type: 'progress-bar', value: -10 } })
    expect(under.find('.ev-loading__value').attributes('style')).toContain('width: 0%')
  })

  it('draws the skeleton as a bare block', () => {
    const wrapper = mount(EvLoading, { props: { type: 'skeleton' } })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.find('.ev-loading__track').exists()).toBe(false)
  })

  // Each type draws its own shape and nothing else.
  it.each([
    ['spinner', '.ev-loading__spinner'],
    ['pulse', '.ev-loading__pulse'],
    ['progress-bar', '.ev-loading__track'],
  ] as const)('%s draws only its own node', (type, own) => {
    const wrapper = mount(EvLoading, { props: { type } })
    expect(wrapper.find(own).exists()).toBe(true)
    for (const other of ['.ev-loading__spinner', '.ev-loading__pulse', '.ev-loading__track']) {
      if (other !== own) expect(wrapper.find(other).exists()).toBe(false)
    }
  })
})
