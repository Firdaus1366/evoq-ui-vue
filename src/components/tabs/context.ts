import type { ComputedRef, InjectionKey, Ref } from 'vue'
import type { TabsVariant } from '../../types'

/** Shared state an `EvTabs` hands to the `EvTab`s beneath it. */
export interface TabsContext {
  variant: Ref<TabsVariant>
  selected: Ref<string | number | null | undefined>
  select: (value: string | number) => void
  /** Registration order, so arrow keys can walk the tabs. */
  register: (value: string | number) => void
  unregister: (value: string | number) => void
  values: ComputedRef<Array<string | number>>
  baseId: string
}

export const TABS_KEY: InjectionKey<TabsContext> = Symbol('EvTabs')
