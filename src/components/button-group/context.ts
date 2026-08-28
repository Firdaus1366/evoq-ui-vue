import type { Ref } from 'vue'
import type { ButtonGroupSize, ButtonGroupVariant } from '../../types'
import type { InjectionKey } from 'vue'

/** What an `EvButtonGroup` hands down so its items need no repeated props. */
export interface ButtonGroupContext {
  variant: Ref<ButtonGroupVariant>
  size: Ref<ButtonGroupSize>
}

export const BUTTON_GROUP_KEY: InjectionKey<ButtonGroupContext> = Symbol('EvButtonGroup')
