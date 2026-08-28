import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EvRichEditor from './EvRichEditor.vue'

describe('EvRichEditor', () => {
  it('renders the three node siblings in the order the board draws them', () => {
    const wrapper = mount(EvRichEditor, { props: { showCount: true } })

    const children = Array.from(wrapper.element.children).map(
      (el) => (el as Element).className.split(' ')[0],
    )
    expect(children).toEqual([
      'ev-rich-editor__content',
      'ev-rich-editor__toolbar',
      'ev-rich-editor__message',
    ])
  })

  it('renders the Title variant while empty, with the mandatory asterisk', () => {
    const wrapper = mount(EvRichEditor, {
      props: { label: 'Konten Artikel', required: true, maxlength: 2000 },
    })

    const empty = wrapper.find('.ev-rich-editor__empty')
    expect(empty.classes()).toContain('ev-rich-editor__empty--title')
    expect(empty.text()).toContain('Konten Artikel')
    expect(wrapper.find('.ev-rich-editor__required').text()).toBe('*')
    expect(wrapper.text()).toContain('/2.000')
  })

  it('renders the Placeholder-default variant when there is no label', () => {
    const wrapper = mount(EvRichEditor, { props: { placeholder: 'Tulis di sini...' } })

    const empty = wrapper.find('.ev-rich-editor__empty')
    expect(empty.classes()).toContain('ev-rich-editor__empty--placeholder')
    expect(empty.text()).toBe('Tulis di sini...')
  })

  it('drops the empty-state text once there is a value', () => {
    const wrapper = mount(EvRichEditor, {
      props: { label: 'Konten', modelValue: '<p>Halo</p>' },
    })

    expect(wrapper.find('.ev-rich-editor__empty').exists()).toBe(false)
  })

  it('renders Type=Big - 19 controls in 8 groups, so 7 separators', () => {
    const wrapper = mount(EvRichEditor)

    expect(wrapper.find('.ev-rich-editor__toolbar').classes()).toContain(
      'ev-rich-editor__toolbar--big',
    )
    expect(wrapper.findAll('.ev-rich-editor__toolbar button')).toHaveLength(19)
    expect(wrapper.findAll('.ev-rich-editor__separator')).toHaveLength(7)
  })

  it('renders Type=Small - 13 controls in 5 groups, so 4 separators', () => {
    const wrapper = mount(EvRichEditor, { props: { toolbar: 'small' } })

    expect(wrapper.find('.ev-rich-editor__toolbar').classes()).toContain(
      'ev-rich-editor__toolbar--small',
    )
    expect(wrapper.findAll('.ev-rich-editor__toolbar button')).toHaveLength(13)
    expect(wrapper.findAll('.ev-rich-editor__separator')).toHaveLength(4)
  })

  it('drops undo/redo, the align group and delete from Type=Small', () => {
    const titles = (t: 'big' | 'small') =>
      mount(EvRichEditor, { props: { toolbar: t } })
        .findAll('.ev-rich-editor__toolbar button')
        .map((b) => b.attributes('title'))

    const big = titles('big')
    const small = titles('small')

    for (const gone of [
      'Urungkan',
      'Ulangi',
      'Rata kiri',
      'Rata tengah',
      'Rata kanan',
      'Hapus semua',
    ]) {
      expect(big).toContain(gone)
      expect(small).not.toContain(gone)
    }
    // Small keeps underline, but the board moves it into the text-size group.
    expect(small.slice(0, 5)).toEqual([
      'Tebal',
      'Miring',
      'Garis bawah',
      'Perbesar teks',
      'Perkecil teks',
    ])
  })

  it('puts the editable surface inside Content, not on it', () => {
    const wrapper = mount(EvRichEditor)

    const body = wrapper.find('.ev-rich-editor__content .ev-rich-editor__body')
    expect(body.attributes('contenteditable')).toBe('true')
    expect(body.attributes('role')).toBe('textbox')
    expect(body.attributes('aria-multiline')).toBe('true')
  })

  it('handles the validation error state', () => {
    const wrapper = mount(EvRichEditor, {
      props: { error: true, validationText: 'Konten tidak boleh kosong' },
    })

    expect(wrapper.classes()).toContain('ev-rich-editor--error')
    expect(wrapper.find('.ev-rich-editor__message-start').text()).toBe('Konten tidak boleh kosong')
    expect(wrapper.find('.ev-rich-editor__body').attributes('aria-invalid')).toBe('true')
  })

  it('keeps the leading message empty outside the error states, as the board does', () => {
    const wrapper = mount(EvRichEditor, { props: { validationText: 'Petunjuk' } })

    expect(wrapper.find('.ev-rich-editor__message-start').text()).toBe('')
  })

  it('hides the toolbar in the disabled state and stops editing', () => {
    const wrapper = mount(EvRichEditor, { props: { disabled: true } })

    expect(wrapper.classes()).toContain('ev-rich-editor--disabled')
    expect(wrapper.find('.ev-rich-editor__toolbar').exists()).toBe(false)
    expect(wrapper.find('.ev-rich-editor__body').attributes('contenteditable')).toBe('false')
  })

  it('handles scroll mode', () => {
    const wrapper = mount(EvRichEditor, { props: { hasScroll: true } })

    expect(wrapper.classes()).toContain('ev-rich-editor--scroll')
  })

  it('emits the three host-supplied actions', async () => {
    const wrapper = mount(EvRichEditor)
    const buttons = wrapper.findAll('.ev-rich-editor__toolbar button')

    await buttons[14]!.trigger('click') // sentiment_satisfied
    await buttons[16]!.trigger('click') // image
    await buttons[17]!.trigger('click') // attach_file

    expect(wrapper.emitted('emoji')).toHaveLength(1)
    expect(wrapper.emitted('image')).toHaveLength(1)
    expect(wrapper.emitted('attach')).toHaveLength(1)
  })
})
