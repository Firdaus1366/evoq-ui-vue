/**
 * Writes one Markdown doc per component, plus a machine-readable manifest,
 * into `docs/components/`. The MCP server (`mcp/server.mjs`) serves exactly
 * these files.
 *
 *     node scripts/build-docs.mjs          # write
 *     node scripts/build-docs.mjs --check  # fail if the committed docs are stale
 *
 * Nothing in a doc is written by hand here. Each part has one source:
 *
 * | Part                         | Source                                         |
 * | ---------------------------- | ---------------------------------------------- |
 * | props / slots / events       | the SFC, via `extract-props.mjs`               |
 * | layer                        | the folder the SFC lives in                    |
 * | composes / used by           | the SFC's own `import EvX from …` lines        |
 * | where extra attributes land  | the element carrying `v-bind="$attrs"`         |
 * | example                      | the playground simulator's demo + generator    |
 * | design guidance, summary     | `design/figma-component-docs.json` (Figma)     |
 * | Figma sets, nesting, keywords| `scripts/component-sources.mjs`                |
 *
 * The run fails - rather than printing a guess - when any of those disagree:
 * a component with no source entry, a Figma key that does not exist, a parent
 * that is not a component, or a pixel value in the Figma prose that has not
 * been checked against the board.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createServer } from 'vite'
import { buildCatalogue } from './extract-props.mjs'
import { FIGMA_NAMES, SOURCES } from './component-sources.mjs'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'docs', 'components')
const CHECK = process.argv.includes('--check')

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const PKG = JSON.parse(read('package.json'))
const FIGMA = JSON.parse(read('design/figma-component-docs.json'))

const LAYERS = [
  { key: 'atom', label: 'Atom', folder: 'atoms' },
  { key: 'molecule', label: 'Molecule', folder: 'molecules' },
  { key: 'organism', label: 'Organism', folder: 'organisms' },
  { key: 'pattern', label: 'Pattern', folder: 'patterns' },
]
const LAYER_LABEL = Object.fromEntries(LAYERS.map((l) => [l.key, l.label]))

/*
 * Pixel values that appear in the Figma prose and have been checked against
 * the boards. Any other `NNpx` in the prose fails the run: the prose is known
 * to carry wrong numbers (AGENTS.md section 6), and a doc must not repeat one.
 */
const VERIFIED_PROSE_PX = new Set([
  '1px', // Separator rule - verify:figma "accordion rule weight" / separator section
  '16px', // input icon size - the Input boards' icon frames
  '24px', // smallest Avatar size - the Avatar set's Size variants
  '44px', // InputSearch height - verify:figma "dropdown search input height"
])

// ----------------------------------------------------------------- naming

/** `EvNavMenuItem` -> `nav-menu-item`. Never changes when a component moves layer. */
export function slugOf(tag) {
  return tag
    .replace(/^Ev/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}
export const idOf = (tag) => `${PKG.name}:${slugOf(tag)}`

// ------------------------------------------------------------ SFC reading

function templateOf(source) {
  const start = source.indexOf('<template>')
  const end = source.lastIndexOf('</template>')
  if (start === -1 || end === -1) return ''
  return source.slice(start + '<template>'.length, end).replace(/<!--[\s\S]*?-->/g, '')
}

/** The Ev components this SFC imports - what it is built from. */
function composesOf(source, tag) {
  const out = new Set()
  for (const m of source.matchAll(/import\s+(Ev[A-Za-z]+)\s+from\s+'[^']+\.vue'/g)) {
    if (m[1] !== tag) out.add(m[1])
  }
  return [...out].sort()
}

/**
 * Where an attribute the component does not declare (class, id, aria-*, data-*)
 * ends up. Vue puts it on the root unless the SFC turns that off and binds
 * `$attrs` somewhere else - which several inputs do, onto the native <input>.
 */
function attrsTargetOf(source) {
  const template = templateOf(source)
  const inheritOff = /inheritAttrs:\s*false/.test(source)
  const root = /<([a-zA-Z][\w-]*)\b([^>]*)>/.exec(template)
  const describe = (tagName, attrs) => {
    const cls = /\sclass="([^"]+)"/.exec(attrs)?.[1]?.split(/\s+/)[0]
    // `<component :is>` renders a/button/span; name it by its class instead.
    if (tagName === 'component') return cls ? `element \`.${cls}\`` : 'element'
    return cls ? `\`<${tagName} class="${cls}">\`` : `\`<${tagName}>\``
  }
  const at = template.indexOf('v-bind="$attrs"')
  if (at === -1) {
    return inheritOff
      ? { where: 'none', text: 'nowhere - the component does not forward them' }
      : { where: 'root', text: `the root ${root ? describe(root[1], root[2]) : 'element'}` }
  }
  const before = template.slice(0, at)
  const open = before.lastIndexOf('<')
  const m = /^<([a-zA-Z][\w-]*)/.exec(before.slice(open))
  const tail = template.slice(open, template.indexOf('>', at) + 1)
  const isRoot = root && root.index === open
  if (!m) return { where: 'root', text: 'the root element' }
  return isRoot
    ? { where: 'root', text: `the root ${describe(m[1], tail)}` }
    : { where: 'inner', text: `the inner ${describe(m[1], tail)}, not the root` }
}

// ------------------------------------------------------------- validation

function fail(message) {
  console.error(`build-docs: ${message}`)
  process.exit(1)
}

function validate(catalogue) {
  const tags = Object.keys(catalogue)
  for (const tag of tags)
    if (!SOURCES[tag]) fail(`${tag} has no entry in scripts/component-sources.mjs`)
  for (const [tag, src] of Object.entries(SOURCES)) {
    if (!catalogue[tag]) fail(`component-sources lists ${tag}, which is not a component`)
    if (src.figma && !FIGMA.docs[src.figma]) fail(`${tag}: no Figma doc "${src.figma}"`)
    for (const other of [src.partOf, ...(src.children ?? [])].filter(Boolean)) {
      if (!catalogue[other]) fail(`${tag} refers to ${other}, which is not a component`)
    }
  }
  for (const [name, tag] of Object.entries(FIGMA_NAMES)) {
    if (!catalogue[tag]) fail(`FIGMA_NAMES maps "${name}" to ${tag}, which is not a component`)
  }
}

function checkProsePx(where, text) {
  for (const px of text.match(/\b\d+px\b/g) ?? []) {
    if (!VERIFIED_PROSE_PX.has(px)) {
      fail(`${where}: Figma prose says "${px}", which has not been checked against the board`)
    }
  }
}

// ---------------------------------------------------------- Figma guidance

function figmaGuidance(tag) {
  const key = SOURCES[tag].figma
  if (!key) return null
  const doc = FIGMA.docs[key]
  let summary = doc.summary
  if (summary && doc.summaryCorrection) {
    summary = summary.replace(doc.summaryCorrection.from, doc.summaryCorrection.to)
  }
  const sections = {
    whenToUse: doc.whenToUse ?? [],
    whenNotToUse: doc.whenNotToUse ?? [],
    do: doc.do ?? [],
    dont: doc.dont ?? [],
  }
  if (summary) checkProsePx(`${key} summary`, summary)
  for (const [name, lines] of Object.entries(sections)) {
    for (const line of lines) checkProsePx(`${key} ${name}`, line)
  }
  return { key, doc, summary, sections }
}

/**
 * Tag every component the prose recommends ("→ use Toggle", "use a Popover")
 * with its id, so an agent can jump straight to it. Only names that follow a
 * recommendation are tagged - "Don't nest a Button inside another Button"
 * recommends nothing and stays as written.
 */
const NAMES = Object.keys(FIGMA_NAMES).sort((a, b) => b.length - a.length)
function linkAdvice(line, seeAlso) {
  return line.replace(
    /(→\s*use\s|—\s*use\s|\buse\s(?:a|an)\s)([^.;→—]*)/gi,
    (whole, lead, rest) => {
      let tagged = rest
      for (const name of NAMES) {
        const re = new RegExp(`\\b${name.replace(/ /g, '\\s+')}\\b(?![^\`]*\`)`, 'i')
        tagged = tagged.replace(re, (hit) => {
          const id = idOf(FIGMA_NAMES[name])
          seeAlso.add(id)
          return `${hit} (\`${id}\`)`
        })
      }
      return lead + tagged
    },
  )
}

// ---------------------------------------------------------------- markdown

const esc = (text) =>
  String(text ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n+/g, ' ')
const code = (text) => `\`${String(text).replace(/\|/g, '\\|')}\``

function table(header, rows) {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.join(' | ')} |`),
  ].join('\n')
}

function yaml(value, indent = '') {
  if (Array.isArray(value)) {
    if (value.length === 0) return ' []'
    return value
      .map((v) =>
        typeof v === 'object'
          ? `\n${indent}-${yaml(v, indent + '  ').replace(/^\n\s*/, ' ')}`
          : `\n${indent}- ${JSON.stringify(v)}`,
      )
      .join('')
  }
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(
        ([k, v]) =>
          `\n${indent}${k}:${typeof v === 'object' && v !== null ? yaml(v, indent + '  ') : ` ${JSON.stringify(v)}`}`,
      )
      .join('')
  }
  return ` ${JSON.stringify(value)}`
}

function renderDoc(entry, figma, example) {
  const { tag, meta } = entry
  const lines = []
  const front = {
    id: entry.id,
    name: tag,
    tag: entry.kebab,
    layer: meta.layer,
    package: PKG.name,
    entry: entry.entry,
    import: entry.importLine,
    source: meta.file,
    summarySource: entry.summarySource,
    partOf: entry.partOf ? idOf(entry.partOf) : null,
    children: entry.children.map(idOf),
    composes: entry.composes.map(idOf),
    usedBy: entry.usedBy.map(idOf),
    seeAlso: entry.seeAlso,
    figma: {
      file: FIGMA.source.fileKey,
      doc: figma ? figma.doc.frame : null,
      sets: entry.sets.map((s) => `${s.name} (${s.id})`),
    },
    keywords: entry.keywords,
  }
  lines.push('---' + yaml(front), '---', '')
  lines.push(
    `<!-- GENERATED by scripts/build-docs.mjs - edit the sources it names, not this file. -->`,
    '',
  )
  lines.push(`# ${tag}`, '')
  if (entry.summary) lines.push(`> ${entry.summary}`, '')

  lines.push(
    table(
      ['Field', 'Value'],
      [
        ['ID', code(entry.id)],
        [
          'Layer',
          `${LAYER_LABEL[meta.layer]} (\`src/${LAYERS.find((l) => l.key === meta.layer).folder}\`)`,
        ],
        ['Import', code(entry.importLine)],
        ['Template tag', `${code(`<${tag}>`)} or ${code(`<${entry.kebab}>`)}`],
        ['Source', code(meta.file)],
        ['Extra attributes go to', entry.attrs.text],
        ...(entry.partOf ? [['Used inside', `${code(idOf(entry.partOf))} (${entry.partOf})`]] : []),
      ],
    ),
    '',
  )

  if (entry.entry !== PKG.name) {
    lines.push(
      `Charts are a separate entry point. Install the optional peers first: \`npm install @unovis/ts @unovis/vue\`.`,
      '',
    )
  }

  // Example
  lines.push('## Example', '')
  lines.push('```vue', example.trimEnd(), '```', '')
  lines.push(
    '_The exact snippet the playground simulator copies for this component (`playground/simulator-demos.ts`)._',
    '',
  )
  if (entry.children.length) {
    lines.push(
      `Its default slot is built to hold ${entry.children.map((c) => `${code(c)} (${code(idOf(c))})`).join(', ')}.`,
      '',
    )
  }

  // Props
  lines.push(`## Props (${meta.props.length})`, '')
  if (meta.props.length) {
    lines.push(
      table(
        ['Prop', 'Type', 'Default', 'Required', 'Description'],
        meta.props.map((p) => [
          code(p.name),
          p.options
            ? p.options.map((o) => code(JSON.stringify(o).replace(/"/g, "'"))).join(' \\| ')
            : code(p.type),
          p.default !== undefined ? code(p.default) : '—',
          p.required ? 'yes' : 'no',
          esc(p.description) || '—',
        ]),
      ),
      '',
    )
  } else {
    lines.push('None.', '')
  }

  const models = meta.emits
    .filter((e) => e.name.startsWith('update:'))
    .map((e) => (e.name === 'update:modelValue' ? 'v-model' : `v-model:${e.name.slice(7)}`))
  if (models.length) lines.push(`**Two-way binding:** ${models.map(code).join(', ')}`, '')

  // Slots
  lines.push(`## Slots (${meta.slots.length})`, '')
  lines.push(
    meta.slots.length
      ? table(
          ['Slot', 'Description'],
          meta.slots.map((s) => [code(s.name), esc(s.description) || '—']),
        )
      : 'None.',
    '',
  )

  // Events
  lines.push(`## Events (${meta.emits.length})`, '')
  lines.push(
    meta.emits.length
      ? table(
          ['Event', 'Description'],
          meta.emits.map((e) => [code(e.name), esc(e.description) || '—']),
        )
      : 'None.',
    '',
  )

  // Composition
  lines.push('## Composition', '')
  lines.push(
    table(
      ['Relation', 'Components'],
      [
        [
          'Built from',
          entry.composes.length
            ? entry.composes.map((c) => code(idOf(c))).join(', ')
            : '— (renders no other Ev component)',
        ],
        ['Used by', entry.usedBy.length ? entry.usedBy.map((c) => code(idOf(c))).join(', ') : '—'],
        [
          'Slot children',
          entry.children.length ? entry.children.map((c) => code(idOf(c))).join(', ') : '—',
        ],
      ],
    ),
    '',
  )

  // Figma guidance
  if (figma) {
    lines.push('## Design guidance', '')
    lines.push(
      `From the Figma page **${figma.doc.page}**, frame \`${figma.doc.frame}\` (${figma.key}). ` +
        "These rules are binding. Names in them are Figma's - the Vue API is the tables above.",
      '',
    )
    const heads = {
      whenToUse: 'When to use',
      whenNotToUse: 'When not to use',
      do: 'Do',
      dont: "Don't",
    }
    for (const [k, head] of Object.entries(heads)) {
      const items = figma.sections[k]
      if (!items.length) continue
      lines.push(`### ${head}`, '')
      for (const item of items) lines.push(`- ${item}`)
      lines.push('')
    }
  }

  // Contract
  lines.push('## Contract', '')
  lines.push(
    `- Only the props, slots and events above exist on \`${tag}\`; anything not listed is not part of its API.`,
    `- An attribute that is not a prop (\`class\`, \`id\`, \`aria-*\`, \`data-*\`) goes to ${entry.attrs.text}.`,
    `- Import it by name from \`${entry.entry}\`; styles come once from \`${PKG.name}/style.css\`.`,
    `- Refer to it by id \`${entry.id}\` - the id stays the same if the component moves layer.`,
    '',
  )
  return lines.join('\n')
}

function renderIndex(entries) {
  const lines = [
    '<!-- GENERATED by scripts/build-docs.mjs - edit the sources it names, not this file. -->',
    '',
    `# ${PKG.name} components`,
    '',
    `${entries.length} components, one document each. Every component has a stable id,`,
    `\`${PKG.name}:<name>\` - the component name without its \`Ev\` prefix, in kebab case.`,
    `\`manifest.json\` holds the same data for machines; \`mcp/server.mjs\` serves both.`,
    '',
  ]
  for (const layer of LAYERS) {
    const rows = entries.filter((e) => e.meta.layer === layer.key)
    if (!rows.length) continue
    lines.push(`## ${layer.label} (${rows.length})`, '')
    lines.push(
      table(
        ['ID', 'Component', 'Summary'],
        rows.map((e) => [`[${code(e.id)}](${e.slug}.md)`, code(e.tag), esc(e.summary) || '—']),
      ),
      '',
    )
  }
  if (!entries.some((e) => e.meta.layer === 'pattern')) {
    lines.push('## Pattern (0)', '', 'No patterns yet - the layer is ready in `src/patterns`.', '')
  }
  return lines.join('\n')
}

// -------------------------------------------------------------------- main

async function loadExamples(catalogue) {
  const server = await createServer({
    configFile: path.join(ROOT, 'vite.config.ts'),
    appType: 'custom',
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  try {
    const { SIMULATOR_DEMOS } = await server.ssrLoadModule('/playground/simulator-demos.ts')
    const { generateCode, initialValues } = await server.ssrLoadModule(
      '/playground/simulator-code.ts',
    )
    const out = {}
    for (const [tag, meta] of Object.entries(catalogue)) {
      const demo = SIMULATOR_DEMOS[tag] ?? {}
      out[tag] = generateCode(meta, initialValues(meta, demo.initial), demo.slotCode)
    }
    return out
  } finally {
    await server.close()
  }
}

async function main() {
  const catalogue = buildCatalogue()
  validate(catalogue)
  const examples = await loadExamples(catalogue)

  const sources = Object.fromEntries(
    Object.keys(catalogue).map((tag) => [
      tag,
      fs.readFileSync(path.join(ROOT, catalogue[tag].file), 'utf8'),
    ]),
  )
  const composes = Object.fromEntries(
    Object.keys(catalogue).map((t) => [t, composesOf(sources[t], t)]),
  )

  const entries = Object.keys(catalogue)
    .sort()
    .map((tag) => {
      const meta = catalogue[tag]
      const src = SOURCES[tag]
      const figma = figmaGuidance(tag)
      const isChart = meta.file.startsWith('src/charts/')
      const entry = isChart ? `${PKG.name}/charts` : PKG.name
      const seeAlso = new Set()
      if (figma) {
        figma.sections.whenNotToUse = figma.sections.whenNotToUse.map((l) => linkAdvice(l, seeAlso))
      }
      // A hand-written summary exists only where the Figma one describes a
      // different component (a Group sharing its item's page), so it wins.
      const summary = src.summary ?? figma?.summary ?? null
      return {
        tag,
        meta,
        figma,
        slug: slugOf(tag),
        id: idOf(tag),
        kebab: `ev-${slugOf(tag)}`,
        entry,
        importLine: `import { ${tag} } from '${entry}'`,
        summary,
        summarySource: src.summary
          ? 'code'
          : figma?.summary
            ? figma.doc.summaryFrom === 'legacy'
              ? 'figma-legacy'
              : 'figma'
            : null,
        sets: src.sets,
        keywords: src.keywords ?? [],
        partOf: src.partOf ?? null,
        children: src.children ?? [],
        composes: composes[tag],
        usedBy: Object.keys(composes)
          .filter((t) => composes[t].includes(tag))
          .sort(),
        seeAlso: [...seeAlso].filter((id) => id !== idOf(tag)).sort(),
        attrs: attrsTargetOf(sources[tag]),
      }
    })

  const files = {}
  for (const e of entries) files[`${e.slug}.md`] = renderDoc(e, e.figma, examples[e.tag])
  files['README.md'] = renderIndex(entries)
  files['manifest.json'] =
    JSON.stringify(
      {
        name: PKG.name,
        version: PKG.version,
        idScheme: `${PKG.name}:<component name without the Ev prefix, kebab-case>. Stable across layer moves.`,
        generatedBy: 'scripts/build-docs.mjs',
        figmaFile: FIGMA.source.fileKey,
        layers: Object.fromEntries(
          LAYERS.map((l) => [l.key, entries.filter((e) => e.meta.layer === l.key).length]),
        ),
        components: entries.map((e) => ({
          id: e.id,
          name: e.tag,
          tag: e.kebab,
          layer: e.meta.layer,
          entry: e.entry,
          import: e.importLine,
          doc: `docs/components/${e.slug}.md`,
          source: e.meta.file,
          summary: e.summary,
          summarySource: e.summarySource,
          attrs: e.attrs.where,
          vModel: e.meta.emits
            .filter((m) => m.name.startsWith('update:'))
            .map((m) => (m.name === 'update:modelValue' ? 'modelValue' : m.name.slice(7))),
          props: e.meta.props.map((p) => ({
            name: p.name,
            type: p.type,
            ...(p.options ? { options: p.options } : {}),
            ...(p.default !== undefined ? { default: p.default } : {}),
            required: p.required,
            ...(p.description ? { description: p.description } : {}),
          })),
          slots: e.meta.slots.map((s) => s.name),
          events: e.meta.emits.map((m) => m.name),
          partOf: e.partOf ? idOf(e.partOf) : null,
          children: e.children.map(idOf),
          composes: e.composes.map(idOf),
          usedBy: e.usedBy.map(idOf),
          seeAlso: e.seeAlso,
          figma: {
            doc: e.figma ? e.figma.doc.frame : null,
            sets: e.sets.map((s) => ({ name: s.name, id: s.id, page: s.page })),
          },
          keywords: e.keywords,
        })),
      },
      null,
      2,
    ) + '\n'

  if (CHECK) {
    const stale = Object.entries(files).filter(([name, text]) => {
      const file = path.join(OUT, name)
      return !fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text
    })
    const extra = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((f) => !(f in files)) : []
    if (stale.length || extra.length) {
      console.error(
        `build-docs: docs are stale (${[...stale.map(([n]) => n), ...extra].join(', ')}). Run \`npm run docs:build\`.`,
      )
      process.exit(1)
    }
    console.log(`docs up to date: ${entries.length} components`)
    return
  }

  fs.rmSync(OUT, { recursive: true, force: true })
  fs.mkdirSync(OUT, { recursive: true })
  for (const [name, text] of Object.entries(files))
    fs.writeFileSync(path.join(OUT, name), text, 'utf8')
  console.log(
    `${entries.length} components -> ${path.relative(ROOT, OUT)} (+ README.md, manifest.json)`,
  )
}

await main()
