/**
 * Shared plumbing for the Figma parity checks.
 *
 * The checks read the *built* stylesheet rather than the SCSS sources. The
 * token layer is four levels of indirection deep (primitive -> library ramp ->
 * brand -> semantic), so a wrong alias still compiles to valid CSS that looks
 * plausible. Only the resolved output proves anything.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const DIST = path.resolve('dist/evoq-ui.css')

export function readBuiltCss() {
  if (!fs.existsSync(DIST)) {
    console.error(`Tidak menemukan ${DIST}.\nJalankan "npm run build" lebih dulu.`)
    process.exit(1)
  }
  return fs.readFileSync(DIST, 'utf8')
}

/**
 * Split a stylesheet into `{ selector, declarations }` pairs.
 *
 * Nested at-rules are flattened: an `@media` wrapper is matched as though it
 * were a selector, which is enough for the flat rules this library emits.
 */
export function parseRules(css) {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    /*
     * A statement at-rule - `@import './fonts.css';` at the top of the file -
     * has no block of its own, so the regex hands it back glued to the front
     * of the next selector. Drop anything up to a `;`, which a selector can
     * never contain, or the first rule in the file stops matching.
     */
    sel: m[1]
      .replace(/[^;{}]*;/g, '')
      .trim()
      .replace(/\s+/g, ' '),
    decls: m[2],
  }))
}

export function createReader(css) {
  const rules = parseRules(css)

  function declsOf(pred) {
    const map = new Map()
    for (const r of rules) {
      if (!pred(r.sel)) continue
      // Minified CSS drops the `;` on a block's final declaration, so the
      // terminator has to be optional or the last token in every block is lost.
      for (const d of r.decls.matchAll(/([a-z-]+|--[a-z0-9-]+)\s*:\s*([^;}]+)(?:;|$)/g)) {
        map.set(d[1], d[2].trim())
      }
    }
    return map
  }

  /** Light mode is the default, so `:root` carries the resolved token values. */
  const tokens = declsOf((s) => /(^|,):root\b/.test(s.replace(/\s/g, '')))

  /**
   * Substitute every `var()` in a value - shorthands such as
   * `0 var(--ev-spacing-xs)` mix literals and references, so a whole-value
   * match is not enough. `scope` holds component-level custom properties.
   */
  function resolve(value, scope = new Map(), depth = 0) {
    if (value == null || depth > 20) return value
    const s = String(value).trim()
    if (!s.includes('var(')) return s
    const next = s.replace(/var\((--ev-[a-z0-9-]+)\)/g, (whole, name) => {
      const v = scope.get(name) ?? tokens.get(name)
      return v === undefined ? whole : v
    })
    return next === s ? s : resolve(next, scope, depth + 1)
  }

  /** Exact selector match, so `.ev-x` never absorbs `.ev-x:hover`. */
  const rule = (selector) => declsOf((s) => s.split(',').some((part) => part.trim() === selector))

  /** Merge several selectors' declarations, later ones winning - the cascade. */
  function merged(...selectors) {
    const out = new Map()
    for (const s of selectors) for (const [k, v] of rule(s)) out.set(k, v)
    return out
  }

  return { tokens, resolve, rule, merged }
}

/**
 * The minifier rewrites colours and numbers: `#0000` for transparent, `#abc`
 * for `#aabbcc`, `.5` for `0.5`. Fold those back before comparing.
 */
export function norm(v) {
  const s = String(v).trim().toLowerCase()
  if (s === '#0000' || s === '#00000000') return 'transparent'
  const m = s.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/)
  if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`
  return s.replace(/(^|\s)\.(\d)/g, '$10.$2')
}

export function createReporter() {
  const passed = []
  const failed = []

  function check(label, got, want) {
    ;(norm(got) === norm(want) ? passed : failed).push(
      `${label}: ${norm(got)} (figma ${norm(want)})`,
    )
  }

  function pass(label, condition, detail) {
    ;(condition ? passed : failed).push(`${label}: ${detail}`)
  }

  return { passed, failed, check, pass }
}
