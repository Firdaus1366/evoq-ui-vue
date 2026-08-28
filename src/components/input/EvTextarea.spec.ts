import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTextarea from './EvTextarea.vue'

describe('EvTextarea', () => {
  it('renders a multi-line textarea with default 4 rows', () => {
    const wrapper = mount(EvTextarea)
    const textarea = wrapper.find('textarea')
    expect(textarea.exists()).toBe(true)
    expect(textarea.attributes('rows')).toBe('4')
  })

  it('sizes Content to the board 80px at the default 4 rows', () => {
    const wrapper = mount(EvTextarea)
    expect(wrapper.find('.ev-textarea__content').attributes('style')).toContain('height: 80px')
  })

  it('renders only Content and the message row, in board order', () => {
    const wrapper = mount(EvTextarea, { props: { showCount: true } })

    const children = Array.from(wrapper.element.children).map((el) => (el as Element).className)
    expect(children).toEqual(['ev-textarea__content', 'ev-textarea__message'])
  })

  it('draws no notched label - the board has no such node', () => {
    const wrapper = mount(EvTextarea, { props: { label: 'Deskripsi' } })
    expect(wrapper.find('.ev-textarea__label').exists()).toBe(false)
  })

  it('renders the Title variant while empty, with the mandatory asterisk', () => {
    const wrapper = mount(EvTextarea, { props: { label: 'Deskripsi', required: true } })
    const empty = wrapper.find('.ev-textarea__empty')
    expect(empty.text()).toContain('Deskripsi')
    expect(wrapper.find('.ev-textarea__required').text()).toBe('*')
    // The Title variant replaces the native placeholder, it does not sit beside it.
    expect(wrapper.find('textarea').attributes('placeholder')).toBeUndefined()
  })

  it('falls back to the native Placeholder-default variant without a label', () => {
    const wrapper = mount(EvTextarea, { props: { placeholder: 'Tulis...' } })
    expect(wrapper.find('.ev-textarea__empty').exists()).toBe(false)
    expect(wrapper.find('textarea').attributes('placeholder')).toBe('Tulis...')
  })

  it('drops the Title variant once there is a value', () => {
    const wrapper = mount(EvTextarea, { props: { label: 'Deskripsi', modelValue: 'Halo' } })
    expect(wrapper.find('.ev-textarea__empty').exists()).toBe(false)
  })

  it('emits update:modelValue on input', async () => {
    const wrapper = mount(EvTextarea)
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Catatan penting')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Catatan penting']])
  })

  it('shows character counter when showCount is true', () => {
    const wrapper = mount(EvTextarea, {
      props: { modelValue: 'Halo', showCount: true, maxlength: 100 },
    })
    expect(wrapper.find('.ev-textarea__message-end').text()).toBe('4/100')
  })

  it('clears value on clear button click', async () => {
    const wrapper = mount(EvTextarea, {
      props: { modelValue: 'Teks', clearable: true },
    })
    const clearBtn = wrapper.find('.ev-textarea__clear')
    expect(clearBtn.exists()).toBe(true)
    await clearBtn.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('applies error styling and displays validation text', () => {
    const wrapper = mount(EvTextarea, {
      props: { error: true, validationText: 'Field tidak boleh kosong' },
    })
    expect(wrapper.classes()).toContain('ev-textarea--error')
    expect(wrapper.find('.ev-textarea__message-start').text()).toBe('Field tidak boleh kosong')
    // The board puts no error glyph inside Content on this node - only InputField has one.
    expect(wrapper.find('.ev-textarea__icon--error').exists()).toBe(false)
  })

  it('keeps the leading message empty outside the error states, as the board does', () => {
    const wrapper = mount(EvTextarea, { props: { validationText: 'Petunjuk', showCount: true } })
    expect(wrapper.find('.ev-textarea__message-start').text()).toBe('')
  })

  it('disables textarea when disabled prop is true', () => {
    const wrapper = mount(EvTextarea, { props: { disabled: true } })
    expect(wrapper.find('textarea').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('ev-textarea--disabled')
  })
})
