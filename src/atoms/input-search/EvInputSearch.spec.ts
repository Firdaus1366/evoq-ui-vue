import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInputSearch from './EvInputSearch.vue'

describe('EvInputSearch', () => {
  it('renders with search icon and placeholder', () => {
    const wrapper = mount(EvInputSearch, {
      props: {
        placeholder: 'Cari transaksi...',
        modelValue: '',
      },
    })

    const input = wrapper.find('input[type="search"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Cari transaksi...')
    expect(wrapper.find('.ev-input-search__icon').exists()).toBe(true)
  })

  it('shows clear button when there is a search term and clears value', async () => {
    const wrapper = mount(EvInputSearch, {
      props: {
        modelValue: 'laptop',
        clearable: true,
      },
    })

    const clearBtn = wrapper.find('.ev-input-search__clear')
    expect(clearBtn.exists()).toBe(true)

    await clearBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([''])
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('emits search event on Enter key', async () => {
    const wrapper = mount(EvInputSearch, {
      props: {
        modelValue: 'monitor 4k',
      },
    })

    const input = wrapper.find('input')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('search')?.[0]).toEqual(['monitor 4k'])
  })

  it('drops the leading glyph when leftIcon is off (Figma: Has L Icon)', () => {
    const wrapper = mount(EvInputSearch, { props: { leftIcon: false, modelValue: 'x' } })
    expect(wrapper.find('.ev-input-search__icon').exists()).toBe(false)
    // "Clear only (R)": the trailing action stays.
    expect(wrapper.find('.ev-input-search__clear').exists()).toBe(true)
  })

  it('draws "None" with neither glyph', () => {
    const wrapper = mount(EvInputSearch, {
      props: { leftIcon: false, clearable: false, modelValue: 'x' },
    })
    expect(wrapper.find('.ev-input-search__icon').exists()).toBe(false)
    expect(wrapper.find('.ev-input-search__clear').exists()).toBe(false)
  })

  it('draws the trailing R icon, and yields it to the clear action while a query is present', async () => {
    const wrapper = mount(EvInputSearch, {
      props: { modelValue: '' },
      slots: { iconRight: '<i class="r" />' },
    })
    expect(wrapper.find('.ev-input-search__icon--right .r').exists()).toBe(true)
    await wrapper.setProps({ modelValue: 'x' })
    expect(wrapper.find('.ev-input-search__icon--right').exists()).toBe(false)
    expect(wrapper.find('.ev-input-search__clear').exists()).toBe(true)
  })

  it('draws no shortcut slot - the board has none', () => {
    const wrapper = mount(EvInputSearch, { slots: { shortcut: '<i class="k" />' } })
    expect(wrapper.find('.k').exists()).toBe(false)
  })
})
