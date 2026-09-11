import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import EvTab from '../../atoms/tab/EvTab.vue'
import EvTabs from './EvTabs.vue'

const Harness = defineComponent({
  props: { variant: { type: String, default: 'segmented' } },
  setup(props) {
    const active = ref<string | number | null>('a')
    return () =>
      h(
        EvTabs,
        {
          modelValue: active.value,
          variant: props.variant as 'segmented' | 'line',
          'onUpdate:modelValue': (v: string | number) => (active.value = v),
        },
        () => [
          h(EvTab, { value: 'a' }, () => 'Satu'),
          h(EvTab, { value: 'b' }, () => 'Dua'),
          h(EvTab, { value: 'c' }, () => 'Tiga'),
        ],
      )
  },
})

describe('EvTabs', () => {
  it('is a tablist holding tabs', () => {
    const wrapper = mount(Harness)
    expect(wrapper.attributes('role')).toBe('tablist')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(3)
  })

  it('marks only the selected tab', () => {
    const wrapper = mount(Harness)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]!.attributes('aria-selected')).toBe('true')
    expect(tabs[1]!.attributes('aria-selected')).toBe('false')
  })

  it('keeps only the selected tab tabbable, for roving focus', () => {
    const wrapper = mount(Harness)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs[0]!.attributes('tabindex')).toBe('0')
    expect(tabs[1]!.attributes('tabindex')).toBe('-1')
  })

  it('selects on click', async () => {
    const wrapper = mount(Harness)
    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    expect(wrapper.findAll('[role="tab"]')[1]!.attributes('aria-selected')).toBe('true')
  })

  it('moves selection with the arrow keys, wrapping at the ends', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    const tabs = () => wrapper.findAll('[role="tab"]')

    await tabs()[0]!.trigger('keydown', { key: 'ArrowRight' })
    expect(tabs()[1]!.attributes('aria-selected')).toBe('true')

    await tabs()[1]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(tabs()[0]!.attributes('aria-selected')).toBe('true')

    await tabs()[0]!.trigger('keydown', { key: 'ArrowLeft' })
    expect(tabs()[2]!.attributes('aria-selected')).toBe('true')

    wrapper.unmount()
  })

  it('jumps to the ends with Home and End', async () => {
    const wrapper = mount(Harness, { attachTo: document.body })
    const tabs = () => wrapper.findAll('[role="tab"]')

    await tabs()[0]!.trigger('keydown', { key: 'End' })
    expect(tabs()[2]!.attributes('aria-selected')).toBe('true')

    await tabs()[2]!.trigger('keydown', { key: 'Home' })
    expect(tabs()[0]!.attributes('aria-selected')).toBe('true')

    wrapper.unmount()
  })

  it('carries the variant onto both the list and its tabs', () => {
    const wrapper = mount(Harness, { props: { variant: 'line' } })
    expect(wrapper.classes()).toContain('ev-tabs--line')
    expect(wrapper.findAll('[role="tab"]')[0]!.classes()).toContain('ev-tab--line')
  })

  it('does not select a disabled tab', async () => {
    const wrapper = mount(EvTabs, {
      props: { modelValue: 'a' },
      slots: { default: () => h(EvTab, { value: 'b', disabled: true }, () => 'Dua') },
    })
    await wrapper.find('[role="tab"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('points each tab at the panel it controls', () => {
    const wrapper = mount(Harness)
    const tab = wrapper.findAll('[role="tab"]')[0]!
    expect(tab.attributes('id')).toContain('-tab-a')
    expect(tab.attributes('aria-controls')).toContain('-panel-a')
  })
})
