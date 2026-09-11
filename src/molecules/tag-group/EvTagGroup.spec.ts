import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvTagGroup from './EvTagGroup.vue'
import EvTag from '../../atoms/tag/EvTag.vue'

describe('EvTagGroup', () => {
  it('renders default spacing and wrap type', () => {
    const wrapper = mount(EvTagGroup, { props: { label: 'Categories' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-label')).toBe('Categories')
    expect(wrapper.classes()).toContain('ev-tag-group--spacing-default')
    expect(wrapper.classes()).toContain('ev-tag-group--type-wrap')
  })

  it('applies loose spacing and scroll type', () => {
    const wrapper = mount(EvTagGroup, { props: { spacing: 'loose', type: 'scroll' } })
    expect(wrapper.classes()).toContain('ev-tag-group--spacing-loose')
    expect(wrapper.classes()).toContain('ev-tag-group--type-scroll')
  })

  it('cascades variant to child tags', () => {
    const parent = mount({
      components: { EvTagGroup, EvTag },
      template: `
        <EvTagGroup variant="outline">
          <EvTag id="tag1">Vue</EvTag>
          <EvTag id="tag2" variant="default">React</EvTag>
        </EvTagGroup>
      `,
    })
    const tag1 = parent.find('#tag1')
    const tag2 = parent.find('#tag2')
    expect(tag1.classes()).toContain('ev-tag--outline')
    expect(tag2.classes()).toContain('ev-tag--default')
  })
})
