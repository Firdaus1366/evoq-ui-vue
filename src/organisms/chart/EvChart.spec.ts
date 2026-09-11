import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvChart from './EvChart.vue'

describe('EvChart', () => {
  it('is a labelled figure', () => {
    const wrapper = mount(EvChart, { props: { title: 'Pendapatan' } })
    expect(wrapper.element.tagName).toBe('FIGURE')
    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ev-chart__title').element.id)
  })

  it.each(['card', 'no-card'] as const)('applies the %s variant', (variant) => {
    expect(mount(EvChart, { props: { variant } }).classes()).toContain(`ev-chart--${variant}`)
  })

  it('renders the optional rows only when filled', () => {
    const bare = mount(EvChart)
    expect(bare.find('.ev-chart__header').exists()).toBe(false)
    expect(bare.find('.ev-chart__summary').exists()).toBe(false)
    expect(bare.find('.ev-chart__legend').exists()).toBe(false)

    const full = mount(EvChart, {
      props: { title: 'T' },
      slots: {
        summary: '<b class="s" />',
        legend: '<b class="l" />',
        headerAction: '<b class="a" />',
      },
    })
    expect(full.find('.ev-chart__summary .s').exists()).toBe(true)
    expect(full.find('.ev-chart__legend .l').exists()).toBe(true)
    expect(full.find('.ev-chart__header-action .a').exists()).toBe(true)
  })
})
