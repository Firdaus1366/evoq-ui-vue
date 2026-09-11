import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvRadio from './EvRadio.vue'

describe('EvRadio', () => {
  it('works standalone against its own modelValue', async () => {
    const wrapper = mount(EvRadio, { props: { value: 'a', modelValue: 'a' } })
    expect(wrapper.classes()).toContain('ev-radio--checked')
    expect((wrapper.find('input').element as HTMLInputElement).checked).toBe(true)
  })

  it('emits its value when selected standalone', async () => {
    const wrapper = mount(EvRadio, { props: { value: 'b', modelValue: 'a' } })
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('does not emit while disabled', async () => {
    const wrapper = mount(EvRadio, { props: { value: 'b', disabled: true } })
    await wrapper.find('input').trigger('change')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
