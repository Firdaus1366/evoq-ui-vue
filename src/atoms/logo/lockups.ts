import type { LogoBrand } from '../../types'
import evoqMark from './assets/evoq-mark.svg?raw'
import evoqWordmark from './assets/evoq-wordmark.svg?raw'
import evoqTagline from './assets/evoq-tagline.svg?raw'
import dataseaMark from './assets/datasea-mark.svg?raw'
import dataseaWordmark from './assets/datasea-wordmark.svg?raw'

export interface LogoPart {
  /** The exported Figma SVG, inlined at build time. */
  svg: string
  /** Where the part's ink starts inside the lockup, in Figma units. */
  x: number
  y: number
  /** The part's own viewBox, so its glyphs keep the coordinates Figma drew. */
  w: number
  h: number
}

export interface Lockup {
  frame: { w: number; h: number }
  parts: { mark: LogoPart; wordmark: LogoPart; tagline: LogoPart | null }
}

/*
 * The two components on the Figma `Logo` page: `EVOQ-Logo` (5092:66984) and
 * `Datasea-Logo` (5092:41618). Both ship whole, one SVG per part, so a product
 * never has to source the logo from somewhere else.
 *
 * `x`/`y` come from each part's render bounds - its ink, not its layer box.
 * They differ for the tagline, whose Playball script overhangs its text frame,
 * and using the layer box there would shift the strap line. `EvLogo` scales
 * every number here from one `size`.
 */
export const LOCKUPS: Record<LogoBrand, Lockup> = {
  evoq: {
    frame: { w: 681.09, h: 194 },
    parts: {
      mark: { svg: evoqMark, x: 0, y: 0, w: 194, h: 194 },
      wordmark: { svg: evoqWordmark, x: 223.75, y: 18.11, w: 458, h: 108 },
      tagline: { svg: evoqTagline, x: 223.83, y: 140.92, w: 313, h: 32 },
    },
  },
  datasea: {
    frame: { w: 322.31, h: 74 },
    parts: {
      mark: { svg: dataseaMark, x: 0, y: 0.56, w: 72, h: 72 },
      wordmark: { svg: dataseaWordmark, x: 91.73, y: 12.35, w: 231, h: 48 },
      tagline: null,
    },
  },
}
