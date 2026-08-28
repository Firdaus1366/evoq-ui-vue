import type { ComputedRef, InjectionKey } from 'vue'
import type { ToggleSize, ToggleVariant } from '../../types'

export interface ToggleGroupContext {
  size: ComputedRef<ToggleSize | undefined>
  variant: ComputedRef<ToggleVariant | undefined>
}

export const TOGGLE_GROUP_KEY: InjectionKey<ToggleGroupContext> = Symbol('TOGGLE_GROUP_KEY')
