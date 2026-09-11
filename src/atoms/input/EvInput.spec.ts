import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvInput from './EvInput.vue'
import EvButtonGroup from '../button-group/EvButtonGroup.vue'
import EvButtonGroupItem from '../button-group/EvButtonGroupItem.vue'
import EvNavMenuItem from '../navigation-menu/EvNavMenuItem.vue'
import EvChart from '../chart/EvChart.vue'

describe('EvInput', () => {
  it('is a text field carrying its value', () => {
    const wrapper = mount(EvInput, { props: { modelValue: 'Halo' } })
    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('text')
    expect((input.element as HTMLInputElement).value).toBe('Halo')
  })

  it('emits on input', async () => {
    const wrapper = mount(EvInput)
    await wrapper.find('input').setValue('Maju')
    expect(wrapper.emitted('update:modelValue')).toEqual([['Maju']])
  })

  it('takes any native type', () => {
    expect(
      mount(EvInput, { props: { type: 'search' } })
        .find('input')
        .attributes('type'),
    ).toBe('search')
  })

  it('wires the label to its own field', () => {
    const wrapper = mount(EvInput, { props: { label: 'Nama' } })
    expect(wrapper.find('label').attributes('for')).toBe(wrapper.find('input').attributes('id'))
  })

  it('marks a required field, and shows the board`s asterisk', () => {
    const wrapper = mount(EvInput, { props: { label: 'Nama', required: true } })
    expect(wrapper.find('input').attributes('required')).toBeDefined()
    expect(wrapper.find('.ev-input__required').text()).toBe('*')
  })

  it('reports the error state and points at the message', () => {
    const wrapper = mount(EvInput, { props: { error: true, validationText: 'Wajib diisi' } })
    const input = wrapper.find('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(
      wrapper.find('.ev-input__message').attributes('id'),
    )
    expect(wrapper.classes()).toContain('ev-input--error')
  })

  it('swaps the trailing icon for the error glyph when invalid', () => {
    const wrapper = mount(EvInput, {
      props: { error: true },
      slots: { iconRight: '<i class="mine" />' },
    })
    expect(wrapper.find('.ev-input__icon--error').exists()).toBe(true)
    expect(wrapper.find('i.mine').exists()).toBe(false)
  })

  it('shows the clear button only when there is something to clear', async () => {
    expect(
      mount(EvInput, { props: { clearable: true } })
        .find('.ev-input__clear')
        .exists(),
    ).toBe(false)

    const wrapper = mount(EvInput, { props: { clearable: true, modelValue: 'isi' } })
    await wrapper.find('.ev-input__clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['']])
    expect(wrapper.emitted('clear')).toHaveLength(1)
  })

  it('hides the clear button while disabled or read-only', () => {
    for (const props of [{ disabled: true }, { readonly: true }]) {
      const wrapper = mount(EvInput, { props: { clearable: true, modelValue: 'x', ...props } })
      expect(wrapper.find('.ev-input__clear').exists()).toBe(false)
    }
  })

  it('renders no message row when there is no message', () => {
    expect(mount(EvInput).find('.ev-input__message').exists()).toBe(false)
  })
})

describe('EvButtonGroup', () => {
  it('is a labelled group', () => {
    const wrapper = mount(EvButtonGroup, { props: { label: 'Halaman' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Halaman')
  })

  it('hands its variant and size down to items that do not override them', () => {
    const wrapper = mount(EvButtonGroup, {
      props: { variant: 'primary', size: 'small' },
      slots: { default: '<button-item />' },
      global: { components: { ButtonItem: EvButtonGroupItem } },
    })
    const item = wrapper.findComponent(EvButtonGroupItem)
    expect(item.classes()).toContain('ev-button-group__item--primary')
    expect(item.classes()).toContain('ev-button-group__item--small')
  })

  it('lets an item override the group', () => {
    const wrapper = mount(EvButtonGroup, {
      props: { variant: 'primary' },
      slots: { default: '<button-item variant="warning" />' },
      global: { components: { ButtonItem: EvButtonGroupItem } },
    })
    expect(wrapper.findComponent(EvButtonGroupItem).classes()).toContain(
      'ev-button-group__item--warning',
    )
  })
})

describe('EvButtonGroupItem', () => {
  it('reports its selected state through aria-pressed', () => {
    expect(mount(EvButtonGroupItem, { props: { active: true } }).attributes('aria-pressed')).toBe(
      'true',
    )
  })

  it('does not emit click while disabled', async () => {
    const wrapper = mount(EvButtonGroupItem, { props: { disabled: true } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })
})

describe('EvNavMenuItem', () => {
  it('takes its shape from its content, as the board does', () => {
    expect(mount(EvNavMenuItem).classes()).toContain('ev-nav-menu-item--text')
    expect(mount(EvNavMenuItem, { slots: { icon: '<i />' } }).classes()).toContain(
      'ev-nav-menu-item--icon-text',
    )
    expect(
      mount(EvNavMenuItem, { props: { iconOnly: true }, slots: { icon: '<i />' } }).classes(),
    ).toContain('ev-nav-menu-item--icon')
  })

  it('marks the current section', () => {
    expect(mount(EvNavMenuItem, { props: { active: true } }).attributes('aria-current')).toBe(
      'page',
    )
  })

  it('is an anchor when given an href', () => {
    expect(mount(EvNavMenuItem, { props: { href: '/a' } }).element.tagName).toBe('A')
    expect(mount(EvNavMenuItem).element.tagName).toBe('BUTTON')
  })
})

describe('EvChart', () => {
  it('is a labelled figure', () => {
    const wrapper = mount(EvChart, { props: { title: 'Pendapatan' } })
    expect(wrapper.element.tagName).toBe('FIGURE')
    expect(wrapper.attributes('aria-labelledby')).toBe(wrapper.find('.ev-chart__title').element.id)
  })

  it.each(['card', 'no-card'] as const)('applies the %s variant', (variant) => {
    expect(mount(EvChart, { props: { variant } }).classes()).toContain(`ev-chart--${variant}`)
  })

  it('renders the optional rows only when filled', () => {
    const bare = mount(EvChart)
    expect(bare.find('.ev-chart__header').exists()).toBe(false)
    expect(bare.find('.ev-chart__summary').exists()).toBe(false)
    expect(bare.find('.ev-chart__legend').exists()).toBe(false)

    const full = mount(EvChart, {
      props: { title: 'T' },
      slots: {
        summary: '<b class="s" />',
        legend: '<b class="l" />',
        headerAction: '<b class="a" />',
      },
    })
    expect(full.find('.ev-chart__summary .s').exists()).toBe(true)
    expect(full.find('.ev-chart__legend .l').exists()).toBe(true)
    expect(full.find('.ev-chart__header-action .a').exists()).toBe(true)
  })
})
