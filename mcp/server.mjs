#!/usr/bin/env node
/**
 * evoq-ui MCP server - serves the generated component docs to AI agents.
 *
 *     npm run mcp                        # in this repo (reads mcp/.env if present)
 *     npx evoq-ui-mcp                    # in an app that installed evoq-ui
 *
 * Transport is MCP-over-HTTP with Server-Sent Events (Express): a client opens
 * `GET /sse`, gets back a `sessionId`, and posts JSON-RPC 2.0 messages to
 * `POST /messages?sessionId=<id>`; every reply and notification for that
 * session is pushed down the open SSE stream, exactly like the product's own
 * `evoq-eprocurement-mcp-fe` server. This lets the server run once, deployed
 * publicly, instead of being spawned per client over stdio.
 *
 * It only ever reads `docs/components/` - the Markdown and `manifest.json`
 * written by `scripts/build-docs.mjs`. It never guesses: a component is
 * fetched by its stable id (`evoq-ui:button`), and anything not in the
 * manifest is reported as not found, with the nearest ids.
 *
 * Tools      list_components, get_component, search_components
 * Resources  evoq-ui://manifest, evoq-ui://components, evoq-ui://components/{slug}
 *
 * Env (see `mcp/.env.example`; copy it to `mcp/.env` to configure a run)
 *   PORT       default 4001
 *   HOST       default 0.0.0.0
 *   API_KEY    empty by default - no auth. Set it to require every /sse and
 *              /messages caller to send it back as `x-api-key: <key>` (or, on
 *              /sse only, `?apiKey=<key>` for clients that cannot set headers
 *              on an SSE connection).
 *   DOCS_DIR   override for the docs directory; defaults to this package's own
 *              `docs/components`. Almost never needed - it exists so a fork
 *              can point the same server at a different doc set.
 */

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import express from 'express'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// `mcp/.env` is optional and gitignored; only fills variables the environment
// has not already set, so a host's own PORT/HOST/API_KEY always wins.
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const rawLine of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const at = line.indexOf('=')
    if (at === -1) continue
    const key = line.slice(0, at).trim()
    let value = line.slice(at + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}
loadEnvFile(path.join(HERE, '.env'))

const PORT = Number(process.env.PORT) || 4001
const HOST = process.env.HOST || '0.0.0.0'

const DOCS = process.env.DOCS_DIR
  ? path.resolve(process.cwd(), process.env.DOCS_DIR)
  : path.resolve(HERE, '..', 'docs', 'components')

let MANIFEST
try {
  MANIFEST = JSON.parse(fs.readFileSync(path.join(DOCS, 'manifest.json'), 'utf8'))
} catch (error) {
  console.error(`evoq-ui MCP: could not read manifest.json under "${DOCS}": ${error.message}`)
  process.exit(1)
}
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

/** Dispatches one already-parsed JSON-RPC message. Transport-agnostic. */
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

// -------------------------------------------------------------- HTTP / SSE

/**
 * Builds the Express app. Exported (rather than only run as a script) so
 * `scripts/mcp-server.spec.ts` can mount it on an ephemeral port and drive it
 * exactly as a client would, over real HTTP.
 *
 * `apiKey` defaults to `process.env.API_KEY`, read here rather than at module
 * load - `start()` still just calls `createApp()`, but a test (or another
 * embedder) can pass its own key, or flip `process.env.API_KEY` and call this
 * again, without the value being frozen at import time.
 */
export function createApp({ apiKey = process.env.API_KEY || '' } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))
  // Body-parser errors (malformed JSON) land here instead of the route.
  app.use((error, _req, res, next) => {
    if (error?.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON body' })
      return
    }
    next(error)
  })

  // A public deploy is typically called from tooling on another origin.
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  /** `allowQuery` lets `/sse` also accept `?apiKey=`, for clients that cannot
   *  set a header on an SSE connection. `/messages` accepts the header only. */
  function requireApiKey(allowQuery) {
    return (req, res, next) => {
      if (!apiKey) return next() // no key configured - auth is off
      const provided = req.get('x-api-key') || (allowQuery ? req.query.apiKey : undefined)
      if (provided !== apiKey) {
        res.status(401).json({ error: 'Unauthorized: missing or invalid API key' })
        return
      }
      next()
    }
  }

  /** sessionId -> the open `res` for that client's `/sse` stream. */
  const sessions = new Map()

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      name: NS,
      version: MANIFEST.version,
      components: MANIFEST.components.length,
      auth: apiKey ? 'required' : 'disabled',
    })
  })

  app.get('/sse', requireApiKey(true), (req, res) => {
    const sessionId = crypto.randomUUID()
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Disables response buffering on nginx-fronted deployments.
      'X-Accel-Buffering': 'no',
    })
    res.write(`event: endpoint\ndata: /messages?sessionId=${sessionId}\n\n`)
    sessions.set(sessionId, res)

    // Keeps the connection open through proxies that drop an idle stream.
    const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 25000)

    req.on('close', () => {
      clearInterval(heartbeat)
      sessions.delete(sessionId)
    })
  })

  app.post('/messages', requireApiKey(false), (req, res) => {
    const sessionId = String(req.query.sessionId ?? '')
    const stream = sessions.get(sessionId)
    if (!stream) {
      res.status(400).json({ error: 'Unknown or closed sessionId. Open /sse first.' })
      return
    }

    const message = req.body ?? {}
    // Notifications (no id) get no reply, on the stream or otherwise.
    if (message.id === undefined) {
      try {
        handle(message)
      } catch {
        /* notifications never answer */
      }
      res.sendStatus(202)
      return
    }

    let reply
    try {
      reply = { jsonrpc: '2.0', id: message.id, result: handle(message) }
    } catch (error) {
      reply = {
        jsonrpc: '2.0',
        id: message.id,
        error: { code: error.rpcCode ?? -32603, message: error.message },
      }
    }
    // The JSON-RPC reply goes down the SSE stream; this response just
    // acknowledges receipt, per the MCP HTTP+SSE transport.
    stream.write(`event: message\ndata: ${JSON.stringify(reply)}\n\n`)
    res.sendStatus(202)
  })

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

  return { app, sessions, apiKey }
}

function start() {
  const { app, apiKey } = createApp()
  const server = app.listen(PORT, HOST, () => {
    console.log(`evoq-ui MCP server listening on http://${HOST}:${PORT}`)
    console.log(`  SSE endpoint:      http://${HOST}:${PORT}/sse`)
    console.log(`  Messages endpoint: http://${HOST}:${PORT}/messages`)
    console.log(`  Health check:      http://${HOST}:${PORT}/health`)
    console.log(
      `  Auth:              ${apiKey ? 'x-api-key required' : 'disabled (no API_KEY set)'}`,
    )
  })
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)))
  }
}

// Runs the server when this file is executed directly (`node mcp/server.mjs`,
// `npx evoq-ui-mcp`) but not when a test imports `createApp`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start()
}
