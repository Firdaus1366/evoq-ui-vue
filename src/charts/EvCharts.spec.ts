import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvBarChart from './EvBarChart.vue'
import EvLineChart from './EvLineChart.vue'
import EvPieChart from './EvPieChart.vue'

const sales = [
  { month: 'Jan', realisasi: 120, target: 100 },
  { month: 'Feb', realisasi: 150, target: 130 },
  { month: 'Mar', realisasi: 90, target: 140 },
]

const slices = [
  { name: 'Pengadaan', total: 40 },
  { name: 'Operasional', total: 25 },
  { name: 'Lainnya', total: 35 },
]

/**
 * Unovis renders through D3 against a real layout, which jsdom does not
 * provide - so these check the wrapper's contract (props, classes, accessible
 * name) rather than the pixels Unovis draws. The drawn result is covered by
 * `npm run verify:figma` against the built CSS instead.
 */
describe('EvBarChart', () => {
  it('is a grouped chart with an accessible name', () => {
    const wrapper = mount(EvBarChart, {
      props: { data: sales, category: 'month', series: ['realisasi'], label: 'Penjualan' },
    })
    expect(wrapper.classes()).toContain('ev-bar-chart--grouped')
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Penjualan')
  })

  it('stacks on request', () => {
    const wrapper = mount(EvBarChart, {
      props: { data: sales, category: 'month', series: ['realisasi', 'target'], type: 'stacked' },
    })
    expect(wrapper.classes()).toContain('ev-bar-chart--stacked')
  })

  it('renders the board`s Basic type as one series, not a separate mode', () => {
    const one = mount(EvBarChart, {
      props: { data: sales, category: 'month', series: ['realisasi'] },
    })
    const many = mount(EvBarChart, {
      props: { data: sales, category: 'month', series: ['realisasi', 'target'] },
    })
    expect(one.classes()).toEqual(many.classes())
  })
})

describe('EvLineChart', () => {
  it('is a line chart by default', () => {
    const wrapper = mount(EvLineChart, {
      props: { data: sales, category: 'month', series: ['realisasi'] },
    })
    expect(wrapper.classes()).toContain('ev-line-chart--line')
  })

  it('fills beneath the trend in area mode', () => {
    const wrapper = mount(EvLineChart, {
      props: { data: sales, category: 'month', series: ['realisasi'], type: 'area' },
    })
    expect(wrapper.classes()).toContain('ev-line-chart--area')
  })
})

describe('EvPieChart', () => {
  it.each(['pie', 'doughnut', 'doughnut-rounded'] as const)('applies the %s type', (type) => {
    const wrapper = mount(EvPieChart, {
      props: { data: slices, value: 'total', category: 'name', type },
    })
    expect(wrapper.classes()).toContain(`ev-pie-chart--${type}`)
  })

  it('carries an accessible name', () => {
    const wrapper = mount(EvPieChart, {
      props: { data: slices, value: 'total', category: 'name', label: 'Komposisi biaya' },
    })
    expect(wrapper.attributes('aria-label')).toBe('Komposisi biaya')
  })
})
