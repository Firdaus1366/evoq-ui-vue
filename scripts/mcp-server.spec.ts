// @vitest-environment node
import fs from 'node:fs'
import path from 'node:path'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../mcp/server.mjs'

/**
 * Drives `mcp/server.mjs` exactly as an MCP client would over its Express/SSE
 * transport - `GET /sse` for the stream, `POST /messages?sessionId=` for
 * JSON-RPC - so a break in either the protocol or the transport shows up
 * here, not in someone's deploy. `createApp` is mounted on an ephemeral port
 * per test file run, never the real `PORT`/`API_KEY` env.
 */

const ROOT = path.resolve(__dirname, '..')
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/components/manifest.json'), 'utf8'),
) as { components: { id: string; name: string; doc: string }[] }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reply = Record<string, any>

/** One `/sse` connection: reads its stream, and posts messages back to it. */
class Client {
  private base: string
  private controller = new AbortController()
  private pending = new Map<number, (message: Reply) => void>()
  private endpoint: Promise<string>
  private nextId = 1

  constructor(base: string, headers: Record<string, string> = {}) {
    this.base = base
    this.endpoint = this.connect(headers)
  }

  private async connect(headers: Record<string, string>) {
    const res = await fetch(`${this.base}/sse`, { headers, signal: this.controller.signal })
    if (!res.ok || !res.body) return Promise.reject(new Error(`SSE open failed: ${res.status}`))
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let endpointResolve!: (value: string) => void
    const endpointPromise = new Promise<string>((resolve) => (endpointResolve = resolve))

    void (async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let at
          while ((at = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, at)
            buffer = buffer.slice(at + 2)
            const eventLine = frame.split('\n').find((l) => l.startsWith('event: '))
            const dataLine = frame.split('\n').find((l) => l.startsWith('data: '))
            if (!dataLine) continue
            const data = dataLine.slice('data: '.length)
            if (eventLine?.slice('event: '.length) === 'endpoint') {
              endpointResolve(data)
            } else {
              const message = JSON.parse(data)
              this.pending.get(message.id)?.(message)
              this.pending.delete(message.id)
            }
          }
        }
      } catch {
        /* aborted on close() - nothing left to read */
      }
    })()

    return endpointPromise
  }

  async rpc(method: string, params?: unknown, headers: Record<string, string> = {}) {
    const id = this.nextId++
    const path = await this.endpoint
    const reply = new Promise<Reply>((resolve) => this.pending.set(id, resolve))
    const res = await fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    })
    return { httpStatus: res.status, ...(await reply) }
  }

  async notify(method: string, params?: unknown) {
    const path = await this.endpoint
    return fetch(`${this.base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params }),
    })
  }

  close() {
    this.controller.abort()
  }
}

let base: string
let server: import('node:http').Server
let client: Client

beforeAll(async () => {
  const { app } = createApp()
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  client = new Client(base)
  await client.rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {} })
  await client.notify('notifications/initialized')
})

afterAll(() => {
  client.close()
  server.close()
})

const call = async (name: string, args: Record<string, unknown>) =>
  (await client.rpc('tools/call', { name, arguments: args })).result

describe('mcp/server.mjs (Express/SSE transport)', () => {
  it('answers GET /health with no auth and no session', async () => {
    const res = await fetch(`${base}/health`)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body).toMatchObject({
      status: 'ok',
      name: 'evoq-ui',
      components: MANIFEST.components.length,
      auth: 'disabled',
    })
  })

  it('hands back a /messages endpoint carrying a sessionId on /sse', async () => {
    const other = new Client(base)
    await other.rpc('ping')
    expect(await (other as unknown as { endpoint: Promise<string> }).endpoint).toMatch(
      /^\/messages\?sessionId=.+/,
    )
    other.close()
  })

  it('rejects a message posted to an unknown or closed sessionId', async () => {
    const res = await fetch(`${base}/messages?sessionId=does-not-exist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    })
    expect(res.status).toBe(400)
  })

  it('negotiates the protocol version the client asked for', async () => {
    const { result } = await client.rpc('initialize', { protocolVersion: '2024-11-05' })
    expect(result.protocolVersion).toBe('2024-11-05')
    expect(result.serverInfo.name).toBe('evoq-ui')
    expect(result.capabilities).toHaveProperty('tools')
    expect(result.capabilities).toHaveProperty('resources')
  })

  it('falls back to its newest version for one it does not know', async () => {
    const { result } = await client.rpc('initialize', { protocolVersion: '1999-01-01' })
    expect(result.protocolVersion).toBe('2025-06-18')
  })

  it('offers the three tools, each with an input schema', async () => {
    const { result } = await client.rpc('tools/list')
    const names = result.tools.map((t: { name: string }) => t.name)
    expect(names).toEqual(['list_components', 'get_component', 'search_components'])
    for (const tool of result.tools) expect(tool.inputSchema.type).toBe('object')
  })

  it('lists every component in the manifest, and filters by layer', async () => {
    const all = await call('list_components', {})
    expect(all.structuredContent.components).toHaveLength(MANIFEST.components.length)

    const atoms = await call('list_components', { layer: 'atom' })
    expect(
      atoms.structuredContent.components.every((c: { layer: string }) => c.layer === 'atom'),
    ).toBe(true)
  })

  it('returns the whole doc for an id, and the manifest entry as json', async () => {
    const doc = await call('get_component', { id: 'evoq-ui:button' })
    expect(doc.content[0].text).toBe(
      fs.readFileSync(path.join(ROOT, 'docs/components/button.md'), 'utf8'),
    )

    const json = await call('get_component', { id: 'evoq-ui:time-picker', format: 'json' })
    expect(json.structuredContent).toMatchObject({
      id: 'evoq-ui:time-picker',
      name: 'EvTimePicker',
      import: "import { EvTimePicker } from 'evoq-ui'",
    })
  })

  it('resolves the Vue name and the kebab tag to the same component', async () => {
    for (const ref of ['EvDropdownList', 'ev-dropdown-list', 'dropdown-list']) {
      const r = await call('get_component', { id: ref, format: 'json' })
      expect(r.structuredContent.id).toBe('evoq-ui:dropdown-list')
    }
  })

  it('reports an unknown id instead of substituting another component', async () => {
    const r = await call('get_component', { id: 'evoq-ui:datepicker' })
    expect(r.isError).toBe(true)
    expect(r.content[0].text).toContain('No component "evoq-ui:datepicker"')
    expect(r.content[0].text).toContain('evoq-ui:calendar')
  })

  it('ranks a component by its exact name above its relatives', async () => {
    const r = await call('search_components', { query: 'button', limit: 3 })
    expect(r.structuredContent.results[0].id).toBe('evoq-ui:button')
  })

  it('finds components by purpose through their keywords', async () => {
    const r = await call('search_components', { query: 'date range' })
    expect(r.structuredContent.results[0].id).toBe('evoq-ui:calendar')
  })

  it('serves every doc as a resource', async () => {
    const { result } = await client.rpc('resources/list')
    const uris = result.resources.map((r: { uri: string }) => r.uri)
    expect(uris).toContain('evoq-ui://manifest')
    expect(uris).toContain('evoq-ui://components/calendar')
    expect(uris).toHaveLength(MANIFEST.components.length + 2)

    const read = await client.rpc('resources/read', { uri: 'evoq-ui://components/calendar' })
    expect(read.result.contents[0].mimeType).toBe('text/markdown')
    expect(read.result.contents[0].text).toContain('# EvCalendar')
  })

  it('answers an unknown method and an unknown resource with JSON-RPC errors', async () => {
    expect((await client.rpc('does/not-exist')).error.code).toBe(-32601)
    expect((await client.rpc('resources/read', { uri: 'evoq-ui://nope' })).error.code).toBe(-32002)
  })

  it('sends no reply for a notification, on the stream or the POST response', async () => {
    const res = await client.notify('notifications/whatever')
    expect(res.status).toBe(202)
  })
})

describe('mcp/server.mjs (API key)', () => {
  const KEY = 'test-secret-key'
  let keyedBase: string
  let keyedServer: import('node:http').Server

  beforeAll(async () => {
    process.env.API_KEY = KEY
    const { app } = createApp()
    keyedServer = app.listen(0)
    await new Promise((resolve) => keyedServer.once('listening', resolve))
    keyedBase = `http://127.0.0.1:${(keyedServer.address() as AddressInfo).port}`
  })

  afterAll(() => {
    delete process.env.API_KEY
    keyedServer.close()
  })

  it('leaves /health open with no key', async () => {
    const res = await fetch(`${keyedBase}/health`)
    expect(res.status).toBe(200)
    expect((await res.json()).auth).toBe('required')
  })

  it('rejects /sse with no key, and with the wrong one', async () => {
    const none = await fetch(`${keyedBase}/sse`)
    expect(none.status).toBe(401)
    const wrong = await fetch(`${keyedBase}/sse`, { headers: { 'x-api-key': 'nope' } })
    expect(wrong.status).toBe(401)
  })

  it('accepts /sse with the header, or with ?apiKey= on that endpoint only', async () => {
    const header = await fetch(`${keyedBase}/sse`, { headers: { 'x-api-key': KEY } })
    expect(header.status).toBe(200)
    await header.body?.cancel()

    const query = await fetch(`${keyedBase}/sse?apiKey=${KEY}`)
    expect(query.status).toBe(200)
    await query.body?.cancel()
  })

  it('accepts /messages with the header only - the query fallback is /sse-only', async () => {
    const authed = new Client(keyedBase, { 'x-api-key': KEY })
    const ok = await authed.rpc('ping', undefined, { 'x-api-key': KEY })
    expect(ok.httpStatus).toBe(202)
    authed.close()

    const headerless = new Client(keyedBase, { 'x-api-key': KEY })
    const path = await (headerless as unknown as { endpoint: Promise<string> }).endpoint
    const res = await fetch(`${keyedBase}${path}&apiKey=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    })
    expect(res.status).toBe(401)
    headerless.close()
  })
})
