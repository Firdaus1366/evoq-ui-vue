import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCommand from './EvCommand.vue'
import EvCommandGroup from './EvCommandGroup.vue'
import EvCommandItem from '../../atoms/command-item/EvCommandItem.vue'
import EvInputSearch from '../../atoms/input-search/EvInputSearch.vue'

const global = { components: { EvCommandGroup, EvCommandItem } }

describe('EvCommand', () => {
  // Board order: Search, then the Sections.
  it('puts the search field above the sections', () => {
    const wrapper = mount(EvCommand)
    const parts = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(parts).toEqual(['ev-command__search', 'ev-command__sections'])
    expect(wrapper.attributes('role')).toBe('dialog')
  })

  it('composes EvInputSearch rather than redrawing it', () => {
    const wrapper = mount(EvCommand, { props: { placeholder: 'Ketik perintah' } })
    expect(wrapper.findComponent(EvInputSearch).props('placeholder')).toBe('Ketik perintah')
  })

  it('emits the query back out', async () => {
    const wrapper = mount(EvCommand)
    wrapper.findComponent(EvInputSearch).vm.$emit('update:modelValue', 'buka')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toEqual([['buka']])
  })

  it('holds its groups in order', () => {
    const wrapper = mount(EvCommand, {
      slots: {
        default: [
          '<ev-command-group heading="Saran"><ev-command-item label="Buka" /></ev-command-group>',
          '<ev-command-group heading="Setelan"><ev-command-item label="Tema" /></ev-command-group>',
        ].join(''),
      },
      global,
    })
    const groups = wrapper.findAllComponents(EvCommandGroup)
    expect(groups).toHaveLength(2)
    expect(groups.map((g) => g.find('.ev-command-item').text())).toEqual(['Saran', 'Setelan'])
  })

  it('shows the empty slot when nothing matches', () => {
    expect(mount(EvCommand).find('.ev-command__empty').exists()).toBe(false)
    const wrapper = mount(EvCommand, { slots: { empty: 'Tidak ada hasil' } })
    expect(wrapper.find('.ev-command__empty').text()).toBe('Tidak ada hasil')
  })

  it('caps the list when given a max height', () => {
    const wrapper = mount(EvCommand, { props: { maxHeight: 280 } })
    expect(wrapper.find('.ev-command__sections').attributes('style')).toContain('max-height: 280px')
  })
})

describe('EvCommandGroup', () => {
  it('renders its heading as the first row, using the same item node', () => {
    const wrapper = mount(EvCommandGroup, {
      props: { heading: 'Saran' },
      slots: { default: '<ev-command-item label="Buka" />' },
      global,
    })
    const items = wrapper.findAllComponents(EvCommandItem)
    expect(items).toHaveLength(2)
    expect(items[0]!.props('heading')).toBe(true)
    expect(items[0]!.props('label')).toBe('Saran')
    expect(items[1]!.props('heading')).toBe(false)
  })

  it('draws no heading row when there is no heading', () => {
    const wrapper = mount(EvCommandGroup, {
      slots: { default: '<ev-command-item label="Buka" />' },
      global,
    })
    expect(wrapper.findAllComponents(EvCommandItem)).toHaveLength(1)
  })

  it('is a list, so its rows are announced as a group', () => {
    const wrapper = mount(EvCommandGroup)
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.find('.ev-command__list').element.tagName).toBe('UL')
  })
})
