import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import EvCard from './EvCard.vue'

describe('EvCard', () => {
  it('is a default card holding its body', () => {
    const wrapper = mount(EvCard, { slots: { default: 'Isi' } })
    expect(wrapper.classes()).toContain('ev-card--default')
    expect(wrapper.find('.ev-card__content').text()).toBe('Isi')
  })

  it.each(['default', 'small', 'image'] as const)('applies the %s type', (type) => {
    expect(mount(EvCard, { props: { type } }).classes()).toContain(`ev-card--${type}`)
  })

  it('renders title and description from props', () => {
    const wrapper = mount(EvCard, { props: { title: 'Judul', description: 'Ringkasan' } })
    expect(wrapper.find('.ev-card__title').text()).toBe('Judul')
    expect(wrapper.find('.ev-card__description').text()).toBe('Ringkasan')
  })

  it('omits the header row when there is nothing to head it with', () => {
    expect(mount(EvCard).find('.ev-card__header-row').exists()).toBe(false)
  })

  it('renders the header action beside the title block', () => {
    const wrapper = mount(EvCard, {
      props: { title: 'Judul' },
      slots: { headerAction: '<button>...</button>' },
    })
    expect(wrapper.find('.ev-card__header-action button').exists()).toBe(true)
  })

  it('renders the media strip only for the image type', () => {
    const withImage = mount(EvCard, {
      props: { type: 'image' },
      slots: { image: '<img src="a.png" />' },
    })
    expect(withImage.find('.ev-card__image img').exists()).toBe(true)

    const wrongType = mount(EvCard, {
      props: { type: 'default' },
      slots: { image: '<img src="a.png" />' },
    })
    expect(wrongType.find('.ev-card__image').exists()).toBe(false)
  })

  it('renders the header slot right beside the title', () => {
    const wrapper = mount(EvCard, {
      props: { title: 'Judul' },
      slots: { headerSlot: '<span class="badge">Baru</span>' },
    })
    expect(wrapper.find('.ev-card__header-slot .badge').exists()).toBe(true)
  })

  it('renders the footer only when filled and not on small type', () => {
    expect(mount(EvCard).find('.ev-card__footer').exists()).toBe(false)
    const wrapper = mount(EvCard, { slots: { footer: '<button>Simpan</button>' } })
    expect(wrapper.find('.ev-card__footer button').exists()).toBe(true)

    const smallWrapper = mount(EvCard, {
      props: { type: 'small' },
      slots: { footer: '<button>Simpan</button>' },
    })
    expect(smallWrapper.find('.ev-card__footer').exists()).toBe(false)
  })
})
