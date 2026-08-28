import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import EvRadio from './EvRadio.vue'
import EvRadioGroup from './EvRadioGroup.vue'

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

describe('EvRadioGroup', () => {
  const Harness = defineComponent({
    setup() {
      const picked = ref<string | number | null>('a')
      return () =>
        h(
          EvRadioGroup,
          { modelValue: picked.value, 'onUpdate:modelValue': (v) => (picked.value = v) },
          () => [h(EvRadio, { value: 'a', label: 'A' }), h(EvRadio, { value: 'b', label: 'B' })],
        )
    },
  })

  it('marks only the selected child as checked', () => {
    const wrapper = mount(Harness)
    const radios = wrapper.findAllComponents(EvRadio)
    expect(radios[0]!.classes()).toContain('ev-radio--checked')
    expect(radios[1]!.classes()).not.toContain('ev-radio--checked')
  })

  it('gives every child the same generated name', () => {
    const wrapper = mount(Harness)
    const names = wrapper.findAll('input').map((i) => i.attributes('name'))
    expect(names[0]).toBeTruthy()
    expect(names[0]).toBe(names[1])
  })

  it('moves the selection when a child is chosen', async () => {
    const wrapper = mount(Harness)
    await wrapper.findAll('input')[1]!.trigger('change')
    const radios = wrapper.findAllComponents(EvRadio)
    expect(radios[1]!.classes()).toContain('ev-radio--checked')
    expect(radios[0]!.classes()).not.toContain('ev-radio--checked')
  })

  it('propagates disabled and error down to its children', () => {
    const wrapper = mount(EvRadioGroup, {
      props: { modelValue: 'a', disabled: true, error: true },
      slots: { default: () => h(EvRadio, { value: 'a' }) },
    })
    const radio = wrapper.findComponent(EvRadio)
    expect(radio.classes()).toContain('ev-radio--disabled')
    expect(radio.classes()).toContain('ev-radio--error')
  })

  it('exposes itself as a radiogroup', () => {
    const wrapper = mount(EvRadioGroup, { props: { label: 'Pilihan' } })
    expect(wrapper.attributes('role')).toBe('radiogroup')
    expect(wrapper.attributes('aria-label')).toBe('Pilihan')
  })
})
