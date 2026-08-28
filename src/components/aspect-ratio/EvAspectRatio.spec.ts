import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvAspectRatio from './EvAspectRatio.vue'

describe('EvAspectRatio', () => {
  it('defaults to 16:9 and translates it for CSS', () => {
    const wrapper = mount(EvAspectRatio)
    expect(wrapper.attributes('style')).toContain('aspect-ratio: 16 / 9')
  })

  it.each(['9:16', '4:5', '5:4', '1:1'])('translates the %s ratio', (ratio) => {
    const wrapper = mount(EvAspectRatio, { props: { ratio } })
    expect(wrapper.attributes('style')).toContain(`aspect-ratio: ${ratio.replace(':', ' / ')}`)
  })

  it('renders slot content', () => {
    const wrapper = mount(EvAspectRatio, { slots: { default: '<img src="a.png" />' } })
    expect(wrapper.find('img').exists()).toBe(true)
  })
})
