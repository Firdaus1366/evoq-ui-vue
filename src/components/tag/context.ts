import type { ComputedRef, InjectionKey } from 'vue'
import type { TagVariant } from '../../types'

export interface TagGroupContext {
  variant: ComputedRef<TagVariant | undefined>
}

export const TAG_GROUP_KEY: InjectionKey<TagGroupContext> = Symbol('TAG_GROUP_KEY')
