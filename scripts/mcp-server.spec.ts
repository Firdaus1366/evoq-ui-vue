// @vitest-environment node
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Drives `mcp/server.mjs` exactly as an MCP client would - JSON-RPC lines over
 * stdio - so a break in the protocol shows up here, not in someone's editor.
 */

const ROOT = path.resolve(__dirname, '..')
const MANIFEST = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/components/manifest.json'), 'utf8'),
) as { components: { id: string; name: string; doc: string }[] }

let server: ChildProcessWithoutNullStreams
let nextId = 1
const pending = new Map<number, (message: Reply) => void>()

// JSON-RPC replies are untyped wire data; the assertions below are the types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Reply = Record<string, any>

function rpc(method: string, params?: unknown): Promise<Reply> {
  const id = nextId++
  return new Promise((resolve) => {
    pending.set(id, resolve)
    server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
  })
}

const call = async (name: string, args: Record<string, unknown>) =>
  (await rpc('tools/call', { name, arguments: args })).result

beforeAll(async () => {
  server = spawn(process.execPath, [path.join(ROOT, 'mcp/server.mjs')], { cwd: ROOT })
  let buffer = ''
  server.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString()
    let at
    while ((at = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, at)
      buffer = buffer.slice(at + 1)
      const message = JSON.parse(line)
      pending.get(message.id)?.(message)
      pending.delete(message.id)
    }
  })
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {} })
  server.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`)
})

afterAll(() => server.kill())

describe('mcp/server.mjs', () => {
  it('negotiates the protocol version the client asked for', async () => {
    const { result } = await rpc('initialize', { protocolVersion: '2024-11-05' })
    expect(result.protocolVersion).toBe('2024-11-05')
    expect(result.serverInfo.name).toBe('evoq-ui')
    expect(result.capabilities).toHaveProperty('tools')
    expect(result.capabilities).toHaveProperty('resources')
  })

  it('falls back to its newest version for one it does not know', async () => {
    const { result } = await rpc('initialize', { protocolVersion: '1999-01-01' })
    expect(result.protocolVersion).toBe('2025-06-18')
  })

  it('offers the three tools, each with an input schema', async () => {
    const { result } = await rpc('tools/list')
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
    const { result } = await rpc('resources/list')
    const uris = result.resources.map((r: { uri: string }) => r.uri)
    expect(uris).toContain('evoq-ui://manifest')
    expect(uris).toContain('evoq-ui://components/calendar')
    expect(uris).toHaveLength(MANIFEST.components.length + 2)

    const read = await rpc('resources/read', { uri: 'evoq-ui://components/calendar' })
    expect(read.result.contents[0].mimeType).toBe('text/markdown')
    expect(read.result.contents[0].text).toContain('# EvCalendar')
  })

  it('answers an unknown method and an unknown resource with JSON-RPC errors', async () => {
    expect((await rpc('does/not-exist')).error.code).toBe(-32601)
    expect((await rpc('resources/read', { uri: 'evoq-ui://nope' })).error.code).toBe(-32002)
  })
})
