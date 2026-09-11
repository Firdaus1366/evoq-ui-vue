/**
 * Reads every `Ev*.vue` in the atomic layer folders (`src/atoms`,
 * `src/molecules`, `src/organisms`, `src/patterns`) and `src/charts`, and writes the playground's
 * props catalogue to `playground/component-props.ts`.
 *
 *     node scripts/extract-props.mjs
 *
 * The catalogue is generated rather than hand-written so the simulator's props
 * table can never drift from the components it documents - a prop renamed in
 * the SFC shows up here on the next run, and a hand-written table would not.
 *
 * It parses the `defineProps<{...}>()` block, the `withDefaults` object beside
 * it, `defineEmits`, `defineSlots`, and the JSDoc above each member. Union
 * types are resolved through `src/types.ts` so `ButtonVariant` becomes a real
 * list of options for a select control.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'playground', 'component-props.ts')

/*
 * Source folder -> atomic layer. The charts are organisms that live in their
 * own folder only because they are a separate package entry point.
 */
const LAYER_DIRS = {
  atoms: 'atom',
  molecules: 'molecule',
  organisms: 'organism',
  patterns: 'pattern',
  charts: 'organism',
}

/** Every `Ev*.vue` in the library, sorted so the output is stable. */
function sourceFiles() {
  const out = []
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/^Ev[A-Za-z]+\.vue$/.test(entry.name)) out.push(full)
    }
  }
  for (const folder of Object.keys(LAYER_DIRS)) {
    const dir = path.join(ROOT, 'src', folder)
    if (fs.existsSync(dir)) walk(dir)
  }
  return out.sort()
}

/** The atomic layer a component belongs to, read off its source folder. */
function layerOf(file) {
  const folder = path.relative(path.join(ROOT, 'src'), file).split(path.sep)[0]
  return LAYER_DIRS[folder]
}

/**
 * Grab the text between the first `<` and its matching `>`, nesting aware.
 *
 * The `>` of an arrow type - `() => unknown`, which every `defineSlots` member
 * ends with - is not a closing bracket, so it has to be stepped over or the
 * scan finishes at the first slot.
 */
function balanced(source, startIndex, open, close) {
  let depth = 0
  for (let i = startIndex; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '>' && source[i - 1] === '=') continue
    if (ch === open) depth += 1
    else if (ch === close) {
      depth -= 1
      if (depth === 0) return { body: source.slice(startIndex + 1, i), end: i }
    }
  }
  return null
}

/** `'a' | 'b' | 'c'` and `24 | 32` become option lists; anything else does not. */
function literalOptions(type) {
  const parts = type
    .replace(/^\s*\|/, '')
    .split('|')
    .map((p) => p.trim())
  if (parts.length < 2) return null
  const options = []
  for (const part of parts) {
    const str = /^'([^']*)'$/.exec(part)
    if (str) {
      options.push(str[1])
      continue
    }
    if (/^\d+(\.\d+)?$/.test(part)) {
      options.push(Number(part))
      continue
    }
    // `undefined` / `null` are not choices a designer makes - skip the union.
    if (part === 'undefined' || part === 'null') continue
    return null
  }
  return options.length >= 2 ? options : null
}

/** Type aliases from `src/types.ts` that are plain literal unions. */
function readTypeAliases() {
  // The charts entry keeps its own unions beside it.
  const files = [path.join(ROOT, 'src', 'types.ts'), path.join(ROOT, 'src', 'charts', 'types.ts')]
  const aliases = {}
  const re = /export type (\w+)\s*=\s*([^\n][\s\S]*?)(?=\n\s*\n|\nexport |\n\/\*\*|$)/g
  for (const file of files) {
    if (!fs.existsSync(file)) continue
    const source = fs.readFileSync(file, 'utf8')
    let match
    while ((match = re.exec(source))) {
      const [, name, rawBody] = match
      const body = rawBody.replace(/\s+/g, ' ').replace(/;$/, '').trim()
      const options = literalOptions(body)
      if (options) aliases[name] = options
    }
  }
  return aliases
}

/** Split a `{ ... }` type body into members, keeping the JSDoc above each. */
function splitMembers(body) {
  const members = []
  let doc = ''
  let buffer = ''
  let depth = 0

  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!buffer && (trimmed.startsWith('/**') || trimmed.startsWith('*') || trimmed === '*/')) {
      if (trimmed.startsWith('/**')) doc = ''
      const text = trimmed
        .replace(/^\/\*\*/, '')
        .replace(/\*\/\s*$/, '')
        .replace(/^\*\s?/, '')
        .trim()
      if (text && text !== '/') doc = doc ? `${doc} ${text}` : text
      continue
    }
    if (!trimmed) continue

    buffer = buffer ? `${buffer} ${trimmed}` : trimmed
    depth += (line.match(/[[{(]/g) || []).length - (line.match(/[\]})]/g) || []).length

    // A member ends when the brackets balance and the line is not a continuation.
    if (depth <= 0 && !/[|&]$/.test(trimmed)) {
      members.push({ doc, text: buffer.replace(/,$/, '').trim() })
      doc = ''
      buffer = ''
      depth = 0
    }
  }
  if (buffer) members.push({ doc, text: buffer.replace(/,$/, '').trim() })
  return members
}

/** The `withDefaults(..., { name: value })` object, as raw source per key. */
function readDefaults(script) {
  const at = script.indexOf('withDefaults(')
  if (at === -1) return {}
  const call = balanced(script, script.indexOf('(', at), '(', ')')
  if (!call) return {}
  const objectAt = call.body.lastIndexOf('{')
  if (objectAt === -1) return {}
  const object = balanced(call.body, objectAt, '{', '}')
  if (!object) return {}

  const defaults = {}
  for (const member of splitMembers(object.body)) {
    const match = /^([\w$]+)\s*:\s*([\s\S]+)$/.exec(member.text)
    if (match) defaults[match[1]] = match[2].trim()
  }
  return defaults
}

/** Names declared by `defineSlots<{...}>()`, with their JSDoc. */
function readNamedBlock(script, macro) {
  const at = script.indexOf(`${macro}<`)
  if (at === -1) return []
  const generic = balanced(script, script.indexOf('<', at), '<', '>')
  if (!generic) return []
  const objectAt = generic.body.indexOf('{')
  if (objectAt === -1) return []
  const object = balanced(generic.body, objectAt, '{', '}')
  if (!object) return []

  return splitMembers(object.body)
    .map((member) => {
      const match = /^\[?'?([\w$:]+)'?\]?\??\s*:/.exec(member.text)
      return match ? { name: match[1], description: member.doc } : null
    })
    .filter(Boolean)
}

function controlFor(type, options) {
  if (options) return 'select'
  const bare = type.replace(/\s/g, '')
  if (bare === 'boolean') return 'boolean'
  if (bare === 'number') return 'number'
  if (bare === 'string') return 'text'
  if (/^string\|number$/.test(bare)) return 'text'
  return 'none'
}

function extract(file, aliases) {
  const source = fs.readFileSync(file, 'utf8')
  const scriptMatch = /<script setup[^>]*>([\s\S]*?)<\/script>/.exec(source)
  if (!scriptMatch) return null
  const script = scriptMatch[1]

  const nameMatch = /defineOptions\(\{\s*name:\s*'([^']+)'/.exec(script)
  const tag = nameMatch ? nameMatch[1] : path.basename(file, '.vue')

  const propsAt = script.indexOf('defineProps<')
  const props = []
  if (propsAt !== -1) {
    const generic = balanced(script, script.indexOf('<', propsAt), '<', '>')
    if (generic) {
      const objectAt = generic.body.indexOf('{')
      const object = objectAt === -1 ? null : balanced(generic.body, objectAt, '{', '}')
      if (object) {
        const defaults = readDefaults(script)
        for (const member of splitMembers(object.body)) {
          const match = /^([\w$]+)(\?)?\s*:\s*([\s\S]+)$/.exec(member.text)
          if (!match) continue
          const [, name, optional, rawType] = match
          const type = rawType.replace(/\s+/g, ' ').trim()
          const options = aliases[type] ?? literalOptions(type)
          const fallback = defaults[name]
          props.push({
            name,
            type,
            required: !optional,
            default: fallback === undefined || fallback === 'undefined' ? undefined : fallback,
            description: member.doc || undefined,
            control: controlFor(type, options),
            options: options ?? undefined,
          })
        }
      }
    }
  }

  return {
    tag,
    file: path.relative(ROOT, file).replace(/\\/g, '/'),
    layer: layerOf(file),
    props,
    slots: readNamedBlock(script, 'defineSlots'),
    emits: readNamedBlock(script, 'defineEmits'),
  }
}

/**
 * Every component's props, slots and events, keyed by tag. Exported so the
 * component docs (`scripts/build-docs.mjs`) read the exact same catalogue the
 * playground does, rather than a second parse that could disagree.
 */
export function buildCatalogue() {
  const aliases = readTypeAliases()
  const catalogue = {}
  for (const file of sourceFiles()) {
    const meta = extract(file, aliases)
    if (meta) catalogue[meta.tag] = meta
  }
  return catalogue
}

const header = `/**
 * GENERATED by \`node scripts/extract-props.mjs\` - do not edit by hand.
 *
 * Every prop, slot and event the library exposes, read straight out of the
 * SFCs so the playground's props tables cannot drift from the components.
 */

export type PropControl = 'boolean' | 'select' | 'number' | 'text' | 'none'

export interface PropMeta {
  name: string
  /** The TypeScript type exactly as the component declares it. */
  type: string
  required: boolean
  /** The literal default from \`withDefaults\`, or undefined when there is none. */
  default?: string
  description?: string
  /** Which simulator control can drive this prop. */
  control: PropControl
  options?: (string | number)[]
}

export interface MemberMeta {
  name: string
  description?: string
}

export type AtomicLayer = 'atom' | 'molecule' | 'organism' | 'pattern'

export interface ComponentMeta {
  tag: string
  file: string
  /** Atomic level, read off the folder the component lives in. */
  layer: AtomicLayer
  props: PropMeta[]
  slots: MemberMeta[]
  emits: MemberMeta[]
}

export const COMPONENT_PROPS: Record<string, ComponentMeta> = `

// Run as a script (not imported): write the playground catalogue.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const catalogue = buildCatalogue()
  fs.writeFileSync(OUT, `${header}${JSON.stringify(catalogue, null, 2)}\n`, 'utf8')

  const componentCount = Object.keys(catalogue).length
  const propCount = Object.values(catalogue).reduce((n, c) => n + c.props.length, 0)
  console.log(`${componentCount} komponen, ${propCount} props -> ${path.relative(ROOT, OUT)}`)
}
