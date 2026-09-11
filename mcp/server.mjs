#!/usr/bin/env node
/**
 * evoq-ui MCP server - serves the generated component docs to AI agents.
 *
 *     node mcp/server.mjs                # in this repo
 *     npx evoq-ui-mcp                    # in an app that installed evoq-ui
 *
 * It speaks MCP (JSON-RPC 2.0, newline-delimited, over stdio) with no
 * dependencies, and only ever reads `docs/components/` - the Markdown and
 * `manifest.json` written by `scripts/build-docs.mjs`. It never guesses: a
 * component is fetched by its stable id (`evoq-ui:button`), and anything that
 * is not in the manifest is reported as not found, with the nearest ids.
 *
 * Tools      list_components, get_component, search_components
 * Resources  evoq-ui://manifest, evoq-ui://components, evoq-ui://components/{slug}
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DOCS = path.resolve(HERE, '..', 'docs', 'components')
const MANIFEST = JSON.parse(fs.readFileSync(path.join(DOCS, 'manifest.json'), 'utf8'))
const NS = MANIFEST.name

const SUPPORTED_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const LAYERS = ['atom', 'molecule', 'organism', 'pattern']

const slugOf = (c) => c.id.slice(NS.length + 1)
const byId = new Map(MANIFEST.components.map((c) => [c.id, c]))

/**
 * Accept the forms a caller is likely to hold - the id, the Vue name, the
 * kebab tag, or the bare slug - but only as exact matches. No fuzzy fallback:
 * a near miss is reported, not silently swapped for a different component.
 */
function lookup(ref) {
  const key = String(ref ?? '').trim()
  if (byId.has(key)) return byId.get(key)
  const lower = key.toLowerCase()
  return MANIFEST.components.find(
    (c) =>
      c.id.toLowerCase() === lower ||
      c.name.toLowerCase() === lower ||
      c.tag === lower ||
      slugOf(c) === lower ||
      `<${c.name.toLowerCase()}>` === lower,
  )
}

const brief = (c) => ({ id: c.id, name: c.name, layer: c.layer, summary: c.summary })

// "evoq" and "ui" are in every id, so they would match everything.
const NS_TOKENS = new Set(NS.toLowerCase().split(/[^a-z0-9]+/))

function search(query, limit = 10) {
  const terms = String(query ?? '')
    .toLowerCase()
    .replace(`${NS.toLowerCase()}:`, '')
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !NS_TOKENS.has(t))
  if (!terms.length) return []
  const scored = MANIFEST.components.map((c) => {
    let score = 0
    const slug = slugOf(c)
    const parts = slug.split('-')
    const keywords = c.keywords.map((k) => k.toLowerCase())
    const summary = (c.summary ?? '').toLowerCase()
    // The component's own name, typed as one word or with spaces, wins outright.
    const phrase = terms.join('-')
    if (phrase === slug || terms.join('') === slug.replace(/-/g, '')) score += 200
    if (keywords.includes(terms.join(' '))) score += 100
    for (const t of terms) {
      if (parts.includes(t)) score += 30
      else if (slug.includes(t)) score += 10
      if (keywords.some((k) => k === t)) score += 25
      else if (keywords.some((k) => k.includes(t))) score += 10
      if (summary.includes(t)) score += 5
    }
    return { c, score }
  })
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.c.id.localeCompare(b.c.id))
    .slice(0, limit)
    .map((s) => ({ ...brief(s.c), score: s.score }))
}

function readDoc(c) {
  return fs.readFileSync(path.resolve(HERE, '..', c.doc), 'utf8')
}

// ------------------------------------------------------------------ tools

const TOOLS = [
  {
    name: 'list_components',
    title: 'List evoq-ui components',
    description:
      'List every evoq-ui component with its stable id, atomic layer and one-line summary. ' +
      'Filter by layer (atom, molecule, organism, pattern). Use the id with get_component.',
    inputSchema: {
      type: 'object',
      properties: {
        layer: {
          type: 'string',
          enum: LAYERS,
          description: 'Only components of this atomic layer.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_component',
    title: 'Get one evoq-ui component',
    description:
      'The full documentation of one component: import line, props (types, allowed values, defaults), ' +
      'slots, events, v-model, composition, a copy-ready example and the design rules. ' +
      `Pass its id (e.g. "${NS}:button"); the Vue name ("EvButton") or tag ("ev-button") also resolve.`,
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: `Component id, e.g. "${NS}:button".` },
        format: {
          type: 'string',
          enum: ['markdown', 'json'],
          description: 'markdown (default): the whole doc. json: the manifest entry only.',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_components',
    title: 'Search evoq-ui components',
    description:
      'Find components by what they are for ("date range", "confirm delete", "chip"). ' +
      'Matches ids, names, keywords and summaries; returns ids ranked by relevance.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Words describing the UI you need.' },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: MANIFEST.components.length,
          description: 'Maximum results (default 10).',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
]

const text = (value) => ({
  type: 'text',
  text: typeof value === 'string' ? value : JSON.stringify(value, null, 2),
})

function callTool(name, args = {}) {
  if (name === 'list_components') {
    if (args.layer && !LAYERS.includes(args.layer)) {
      return {
        isError: true,
        content: [text(`Unknown layer "${args.layer}". Use one of: ${LAYERS.join(', ')}.`)],
      }
    }
    const components = MANIFEST.components
      .filter((c) => !args.layer || c.layer === args.layer)
      .map(brief)
    return { content: [text(components)], structuredContent: { components } }
  }

  if (name === 'get_component') {
    const c = lookup(args.id)
    if (!c) {
      const near = search(args.id, 5)
      return {
        isError: true,
        content: [
          text(
            `No component "${args.id}" in ${NS}.` +
              (near.length
                ? ` Closest ids: ${near.map((n) => n.id).join(', ')}.`
                : ' Call list_components for every id.'),
          ),
        ],
      }
    }
    if (args.format === 'json') return { content: [text(c)], structuredContent: c }
    return { content: [text(readDoc(c))] }
  }

  if (name === 'search_components') {
    const results = search(args.query, args.limit ?? 10)
    return { content: [text(results)], structuredContent: { results } }
  }

  return null
}

// -------------------------------------------------------------- resources

const RESOURCES = [
  {
    uri: `${NS}://manifest`,
    name: 'manifest',
    title: `${NS} component manifest`,
    description:
      'Every component as JSON: id, import, props, slots, events, composition, Figma ids.',
    mimeType: 'application/json',
  },
  {
    uri: `${NS}://components`,
    name: 'components',
    title: `${NS} component index`,
    description: 'Every component id grouped by atomic layer, with summaries.',
    mimeType: 'text/markdown',
  },
  ...MANIFEST.components.map((c) => ({
    uri: `${NS}://components/${slugOf(c)}`,
    name: c.id,
    title: c.name,
    description: c.summary ?? undefined,
    mimeType: 'text/markdown',
  })),
]

function readResource(uri) {
  if (uri === `${NS}://manifest`) {
    return {
      uri,
      mimeType: 'application/json',
      text: fs.readFileSync(path.join(DOCS, 'manifest.json'), 'utf8'),
    }
  }
  if (uri === `${NS}://components`) {
    return {
      uri,
      mimeType: 'text/markdown',
      text: fs.readFileSync(path.join(DOCS, 'README.md'), 'utf8'),
    }
  }
  const prefix = `${NS}://components/`
  if (uri.startsWith(prefix)) {
    const c = byId.get(`${NS}:${uri.slice(prefix.length)}`)
    if (c) return { uri, mimeType: 'text/markdown', text: readDoc(c) }
  }
  return null
}

// --------------------------------------------------------------- protocol

const INSTRUCTIONS =
  `${NS} is a Vue 3 design system (${MANIFEST.components.length} components, ported 1:1 from Figma). ` +
  `Every component has a stable id "${NS}:<name>". To use one: search_components or list_components to ` +
  'find the id, then get_component for its exact API. Use only the props, slots and events that doc lists, ' +
  `import by name from "${NS}" (charts from "${NS}/charts"), and load "${NS}/style.css" once.`

function handle(message) {
  const { id, method, params = {} } = message
  switch (method) {
    case 'initialize': {
      const asked = params.protocolVersion
      return {
        protocolVersion: SUPPORTED_VERSIONS.includes(asked) ? asked : SUPPORTED_VERSIONS[0],
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false, subscribe: false },
        },
        serverInfo: { name: NS, title: `${NS} component docs`, version: MANIFEST.version },
        instructions: INSTRUCTIONS,
      }
    }
    case 'ping':
      return {}
    case 'tools/list':
      return { tools: TOOLS }
    case 'tools/call': {
      const result = callTool(params.name, params.arguments)
      if (!result) throw rpcError(-32602, `Unknown tool: ${params.name}`)
      return result
    }
    case 'resources/list':
      return { resources: RESOURCES }
    case 'resources/templates/list':
      return {
        resourceTemplates: [
          {
            uriTemplate: `${NS}://components/{slug}`,
            name: 'component',
            title: `${NS} component doc`,
            description: `One component's doc; {slug} is its id without "${NS}:".`,
            mimeType: 'text/markdown',
          },
        ],
      }
    case 'resources/read': {
      const contents = readResource(params.uri)
      if (!contents) throw rpcError(-32002, `Resource not found: ${params.uri}`)
      return { contents: [contents] }
    }
    default:
      if (id === undefined) return undefined // an unknown notification needs no reply
      throw rpcError(-32601, `Method not found: ${method}`)
  }
}

function rpcError(code, message) {
  return Object.assign(new Error(message), { rpcCode: code })
}

function send(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`)
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })
rl.on('line', (line) => {
  if (!line.trim()) return
  let message
  try {
    message = JSON.parse(line)
  } catch {
    send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
    return
  }
  // Notifications (no id) get no response.
  if (message.id === undefined) {
    try {
      handle(message)
    } catch {
      /* notifications never answer */
    }
    return
  }
  try {
    send({ jsonrpc: '2.0', id: message.id, result: handle(message) })
  } catch (error) {
    send({
      jsonrpc: '2.0',
      id: message.id,
      error: { code: error.rpcCode ?? -32603, message: error.message },
    })
  }
})
rl.on('close', () => process.exit(0))
