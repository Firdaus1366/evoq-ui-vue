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
})
