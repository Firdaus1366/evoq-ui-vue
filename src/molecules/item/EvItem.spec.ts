import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvItem from './EvItem.vue'
import EvLabelItem from '../../atoms/label-item/EvLabelItem.vue'
import type { ItemType } from '../../types'

const TYPES: ItemType[] = ['default', 'outline', 'muted']

describe('EvItem', () => {
  it.each(TYPES)('applies the %s type class', (type) => {
    expect(mount(EvItem, { props: { type } }).classes()).toContain(`ev-item--${type}`)
  })

  // The board instances .LabelItem here - it must be composed, not redrawn.
  it('composes EvLabelItem for its title and caption', () => {
    const wrapper = mount(EvItem, { props: { title: 'Alex', description: 'alex@example.com' } })
    const label = wrapper.findComponent(EvLabelItem)
    expect(label.exists()).toBe(true)
    expect(label.find('.ev-label-item__title').text()).toBe('Alex')
    expect(label.find('.ev-label-item__description').text()).toBe('alex@example.com')
  })

  it('passes the label type through to the instance', () => {
    const wrapper = mount(EvItem, { props: { labelType: 'small', title: 'A' } })
    expect(wrapper.findComponent(EvLabelItem).classes()).toContain('ev-label-item--small')
  })

  // Board order: Label frame, Button, Description, R Icon.
  it('keeps the board order of its parts', () => {
    const wrapper = mount(EvItem, {
      props: { title: 'Alex', trailing: '12:04' },
      slots: { actions: '<button />', trailingIcon: '<i />' },
    })
    const parts = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(parts).toEqual([
      'ev-item__label',
      'ev-item__actions',
      'ev-item__trailing',
      'ev-item__trailing-icon',
    ])
  })

  // Inside the Label frame: Icon, Avatar, Image, .LabelItem.
  it('keeps the board order inside the label frame', () => {
    const wrapper = mount(EvItem, {
      props: { title: 'Alex' },
      slots: { icon: '<i />', avatar: '<span />', image: '<img />' },
    })
    const parts = Array.from(wrapper.find('.ev-item__label').element.children).map(
      (el) => (el as Element).className.split(' ')[0],
    )
    expect(parts).toEqual(['ev-item__icon', 'ev-item__avatar', 'ev-item__image', 'ev-item__text'])
  })

  it('draws optional parts only when they are filled', () => {
    const wrapper = mount(EvItem, { props: { title: 'Alex' } })
    for (const part of [
      '.ev-item__icon',
      '.ev-item__avatar',
      '.ev-item__image',
      '.ev-item__actions',
      '.ev-item__trailing',
      '.ev-item__trailing-icon',
    ]) {
      expect(wrapper.find(part).exists()).toBe(false)
    }
  })
})
