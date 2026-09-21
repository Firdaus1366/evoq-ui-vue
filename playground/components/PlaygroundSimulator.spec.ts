import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PlaygroundSimulator from './PlaygroundSimulator.vue'
import { COMPONENT_PROPS } from '../component-props'
import { SIMULATOR_DEMOS } from '../simulator-demos'

/**
 * The catalogue is generated, so the thing worth testing is that every entry in
 * it actually mounts and produces copyable markup - a prop the extractor got
 * wrong shows up here as a render error rather than as a broken page.
 */

const TAGS = Object.keys(COMPONENT_PROPS)

/** Unovis reaches for layout APIs jsdom does not implement. */
const CHART_TAGS = ['EvBarChart', 'EvLineChart', 'EvPieChart', 'EvChart']
const MOUNTABLE = TAGS.filter((tag) => !CHART_TAGS.includes(tag))

describe('PlaygroundSimulator', () => {
  it('has a catalogue covering the whole library', () => {
    expect(TAGS.length).toBeGreaterThanOrEqual(50)
    for (const tag of TAGS) {
      expect(COMPONENT_PROPS[tag]!.file).toMatch(/^src\//)
    }
  })

  it('files every component under an atomic layer folder', () => {
    const FOLDER = {
      atom: 'atoms',
      molecule: 'molecules',
      organism: 'organisms',
      pattern: 'patterns',
    }
    for (const tag of TAGS) {
      const { file, layer } = COMPONENT_PROPS[tag]!
      // Charts are organisms kept in their own entry-point folder.
      const folder = file.startsWith('src/charts/') ? 'organisms' : file.split('/')[1]
      expect(folder, tag).toBe(FOLDER[layer])
    }
  })

  it('badges the simulator with the component layer', () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvButton' } })
    expect(wrapper.find('.pg-sim__layer').text()).toBe('atom')
    wrapper.unmount()
  })

  it.each(MOUNTABLE)('mounts %s without throwing', (tag) => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag } })
    expect(wrapper.find('.pg-sim__title').text()).toBe(tag)
    wrapper.unmount()
  })

  it('generates a self-closing tag when nothing differs from the defaults', () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvSeparator' } })
    expect(wrapper.find('pre code').text()).toBe('<EvSeparator />')
  })

  it('prints changed props, and only those', async () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvButton' } })

    // Straight from the defaults, only the slot body should show.
    expect(wrapper.find('pre code').text()).toBe('<EvButton>\n  Simpan perubahan\n</EvButton>')

    const selects = wrapper.findAll('.pg-sim__panel select')
    await selects[0]!.setValue('destructive')
    const code = wrapper.find('pre code').text()

    expect(code).toContain('variant="destructive"')
    // `size` is still at its default, so it must stay out of the snippet.
    expect(code).not.toContain('size=')
  })

  it('writes a true boolean as the shorthand attribute', async () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvButton' } })
    const boxes = wrapper.findAll('.pg-sim__panel input[type="checkbox"]')

    // One attribute stays on the opening line; several break onto their own.
    await boxes[0]!.setValue(true) // disabled
    expect(wrapper.find('pre code').text()).toBe(
      '<EvButton disabled>\n  Simpan perubahan\n</EvButton>',
    )

    await boxes[1]!.setValue(true) // loading
    const code = wrapper.find('pre code').text()
    expect(code).toContain('\n  disabled\n')
    expect(code).toContain('\n  loading\n')
  })

  it('renders a props table row for every declared prop', () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvSwitch' } })
    // The table is capped at 8 rows until expanded.
    expect(wrapper.findAll('.pg-sim__table tbody tr').length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain(`Props (${COMPONENT_PROPS.EvSwitch!.props.length})`)
  })

  it('lists slots and events when the component declares them', () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvAlert' } })
    expect(wrapper.text()).toContain(`Slots (${COMPONENT_PROPS.EvAlert!.slots.length})`)
    expect(wrapper.text()).toContain('close')
  })

  it('gives every demo entry a component that exists in the catalogue', () => {
    for (const tag of Object.keys(SIMULATOR_DEMOS)) {
      expect(COMPONENT_PROPS[tag], `${tag} has a demo but no catalogue entry`).toBeDefined()
    }
  })

  it('lets the dropdown demo open, pick an option, fill the field and close', async () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvInputDropdown' } })
    expect(wrapper.find('.ev-input-dropdown__slot').exists()).toBe(false)
    await wrapper.find('.ev-input-dropdown__content').trigger('click')
    const rows = wrapper.findAll('.ev-dropdown-item')
    expect(rows.length).toBeGreaterThan(0)
    await rows[1]?.trigger('click')
    expect(wrapper.find('.ev-input-dropdown__value').text()).toBe('Gudang')
    expect(wrapper.find('.ev-input-dropdown__slot').exists()).toBe(false)
    wrapper.unmount()
  })

  it('mounts its own calendar / time picker in the Date and Time demos once opened', async () => {
    for (const [tag, picker] of [
      ['EvInputDate', '.ev-calendar'],
      ['EvInputTime', '.ev-time-picker'],
    ] as const) {
      const wrapper = mount(PlaygroundSimulator, { props: { tag } })
      await wrapper.find('.ev-input-' + tag.slice(7).toLowerCase() + '__content').trigger('click')
      expect(wrapper.find(picker).exists(), tag).toBe(true)
      wrapper.unmount()
    }
  })

  it('lets the multi-select demo tick an option into the field', async () => {
    const wrapper = mount(PlaygroundSimulator, { props: { tag: 'EvInputMultipleField' } })
    await wrapper.find('.ev-input-multiple-field__content').trigger('click')
    const before = wrapper.findAll('.ev-tag').length
    await wrapper.findAll('.ev-input-multiple-options input')[1]?.setValue(true)
    expect(wrapper.findAll('.ev-tag').length).toBe(before + 1)
    wrapper.unmount()
  })
})
