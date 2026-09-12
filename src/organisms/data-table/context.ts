import type { ComputedRef, InjectionKey } from 'vue'
import type { DataTableVariant } from '../../types'

/**
 * What `EvDataTable` hands its rows and cells. The board's three fill
 * variants change the padding and the rules inside every cell, so the parts
 * read the variant from the table rather than repeating it as a prop.
 */
export interface DataTableContext {
  variant: ComputedRef<DataTableVariant>
}

export const DATA_TABLE_KEY: InjectionKey<DataTableContext> = Symbol('ev-data-table')
