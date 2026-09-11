import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import EvCarousel from './EvCarousel.vue'
import EvCarouselSlide from './EvCarouselSlide.vue'

/**
 * Slides register themselves in `onMounted`, so the parent only knows how many
 * there are on the following tick. Every test that reads the indicator has to
 * wait for it.
 */
async function mountCarousel(props = {}) {
  const wrapper = mount(Harness, { props })
  await nextTick()
  return wrapper
}

const Harness = defineComponent({
  props: {
    slides: { type: Number, default: 3 },
    showButtons: { type: Boolean, default: true },
    showIndicator: { type: Boolean, default: true },
    ratio: { type: String, default: '16:9' },
  },
  setup(props) {
    const index = ref(0)
    return () =>
      h(
        EvCarousel,
        {
          modelValue: index.value,
          showButtons: props.showButtons,
          showIndicator: props.showIndicator,
          ratio: props.ratio,
          'onUpdate:modelValue': (v: number) => (index.value = v),
        },
        () => Array.from({ length: props.slides }, (_, i) => h(EvCarouselSlide, {}, () => `S${i}`)),
      )
  },
})

describe('EvCarousel', () => {
  it('describes itself as a carousel', () => {
    const wrapper = mount(EvCarousel, { props: { label: 'Galeri' } })
    expect(wrapper.attributes('role')).toBe('group')
    expect(wrapper.attributes('aria-roledescription')).toBe('carousel')
    expect(wrapper.attributes('aria-label')).toBe('Galeri')
  })

  it('draws one dot per registered slide', async () => {
    const wrapper = await mountCarousel({ slides: 4 })
    expect(wrapper.findAll('.ev-carousel__dot')).toHaveLength(4)
  })

  it('marks the active dot', async () => {
    const wrapper = await mountCarousel()
    const dots = wrapper.findAll('.ev-carousel__dot')
    expect(dots[0]!.classes()).toContain('ev-carousel__dot--active')
    expect(dots[1]!.classes()).not.toContain('ev-carousel__dot--active')
  })

  it('steps forward and back with the buttons', async () => {
    const wrapper = await mountCarousel()
    await wrapper.find('.ev-carousel__button--next').trigger('click')
    expect(wrapper.findAll('.ev-carousel__dot')[1]!.classes()).toContain('ev-carousel__dot--active')

    await wrapper.find('.ev-carousel__button--previous').trigger('click')
    expect(wrapper.findAll('.ev-carousel__dot')[0]!.classes()).toContain('ev-carousel__dot--active')
  })

  it('disables the buttons at each end', async () => {
    const wrapper = await mountCarousel({ slides: 2 })
    expect(wrapper.find('.ev-carousel__button--previous').attributes('disabled')).toBeDefined()

    await wrapper.find('.ev-carousel__button--next').trigger('click')
    expect(wrapper.find('.ev-carousel__button--next').attributes('disabled')).toBeDefined()
  })

  it('jumps straight to a slide from its dot', async () => {
    const wrapper = await mountCarousel({ slides: 5 })
    await wrapper.findAll('.ev-carousel__dot')[3]!.trigger('click')
    expect(wrapper.findAll('.ev-carousel__dot')[3]!.classes()).toContain('ev-carousel__dot--active')
  })

  it('hides the buttons and the indicator on request', async () => {
    const wrapper = await mountCarousel({ showButtons: false, showIndicator: false })
    expect(wrapper.find('.ev-carousel__button').exists()).toBe(false)
    expect(wrapper.find('.ev-carousel__indicator').exists()).toBe(false)
  })

  it('keeps the track reachable even with both controls hidden', async () => {
    const wrapper = await mountCarousel({ showButtons: false, showIndicator: false })
    expect(wrapper.find('.ev-carousel__track').attributes('tabindex')).toBe('0')
  })

  it('gives every slide the carousel`s one ratio', async () => {
    const wrapper = await mountCarousel({ ratio: '1:1', slides: 3 })
    for (const slide of wrapper.findAll('.ev-carousel-slide')) {
      expect(slide.attributes('style')).toContain('aspect-ratio: 1 / 1')
    }
  })

  it('hides the inactive slides from assistive tech', async () => {
    const wrapper = await mountCarousel()
    const slides = wrapper.findAll('.ev-carousel-slide')
    expect(slides[0]!.attributes('aria-hidden')).toBeUndefined()
    expect(slides[1]!.attributes('aria-hidden')).toBe('true')
  })

  it('lets the indicator be replaced wholesale', async () => {
    const wrapper = mount(EvCarousel, {
      slots: {
        default: () => [h(EvCarouselSlide), h(EvCarouselSlide)],
        indicator: `<template #indicator="{ count }"><b class="custom">{{ count }}</b></template>`,
      },
    })
    await nextTick()
    expect(wrapper.find('b.custom').text()).toBe('2')
    expect(wrapper.find('.ev-carousel__dot').exists()).toBe(false)
  })

  it('scrolls the other way when vertical', () => {
    const wrapper = mount(EvCarousel, { props: { orientation: 'vertical' } })
    expect(wrapper.classes()).toContain('ev-carousel--vertical')
  })
})
