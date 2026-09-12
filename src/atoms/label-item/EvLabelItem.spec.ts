import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvLabelItem from './EvLabelItem.vue'
import type { LabelItemType } from '../../types'

const TYPES: LabelItemType[] = ['default', 'small', 'extra-small']

describe('EvLabelItem', () => {
  it('renders the title and caption in board order', () => {
    const wrapper = mount(EvLabelItem, { props: { title: 'Title', description: 'Description' } })
    const children = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(children).toEqual(['ev-label-item__title', 'ev-label-item__description'])
  })

  it.each(TYPES)('applies the %s type class', (type) => {
    expect(mount(EvLabelItem, { props: { type } }).classes()).toContain(`ev-label-item--${type}`)
  })

  it('draws no caption node when there is no caption', () => {
    const wrapper = mount(EvLabelItem, { props: { title: 'Title' } })
    expect(wrapper.find('.ev-label-item__description').exists()).toBe(false)
  })

  it('treats a description slot the same as the prop', () => {
    const wrapper = mount(EvLabelItem, { slots: { description: 'Dari slot' } })
    expect(wrapper.find('.ev-label-item__description').text()).toBe('Dari slot')
  })

  it('lets the default slot replace the title', () => {
    const wrapper = mount(EvLabelItem, { props: { title: 'Prop' }, slots: { default: 'Slot' } })
    expect(wrapper.find('.ev-label-item__title').text()).toBe('Slot')
  })
})
