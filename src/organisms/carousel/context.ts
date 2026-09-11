import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { AspectRatio, CarouselOrientation } from '../../types'

/** Shared state an `EvCarousel` hands to the slides beneath it. */
export interface CarouselContext {
  orientation: Ref<CarouselOrientation>
  ratio: Ref<AspectRatio | string>
  active: ComputedRef<number>
  /** Slides register in render order so the indicator matches the DOM. */
  register: (id: symbol) => void
  unregister: (id: symbol) => void
  indexOf: (id: symbol) => number
}

export const CAROUSEL_KEY: InjectionKey<CarouselContext> = Symbol('EvCarousel')
