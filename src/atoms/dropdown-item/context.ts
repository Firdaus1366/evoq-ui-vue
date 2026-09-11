import type { ComputedRef, InjectionKey } from 'vue'

export interface DropdownListContext {
  /** The list is a menu of actions or links, not a listbox of options. */
  menu: ComputedRef<boolean>
}

export const DROPDOWN_LIST_KEY: InjectionKey<DropdownListContext> = Symbol('DROPDOWN_LIST_KEY')
