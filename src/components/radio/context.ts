import type { ComputedRef, InjectionKey, Ref } from 'vue'

/**
 * Shared state an `EvRadioGroup` hands to the `EvRadio`s beneath it. A radio
 * can still be used standalone - every consumer treats a missing group as
 * "manage my own state".
 */
export interface RadioGroupContext {
  name: ComputedRef<string>
  selected: Ref<string | number | null | undefined>
  disabled: Ref<boolean>
  error: Ref<boolean>
  select: (value: string | number) => void
}

export const RADIO_GROUP_KEY: InjectionKey<RadioGroupContext> = Symbol('EvRadioGroup')
