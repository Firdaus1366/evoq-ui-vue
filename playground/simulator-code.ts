/**
 * The simulator's code generator, kept free of Vue so two things share it:
 * the playground's props simulator, and the component docs
 * (`scripts/build-docs.mjs`). The snippet a doc prints is therefore exactly
 * the snippet the simulator copies - one generator, never two that drift.
 */

import type { ComponentMeta, PropMeta } from './component-props'

/** Parse a `withDefaults` literal back into a real value. */
export function parseDefault(raw: string | undefined): unknown {
  if (raw === undefined) return undefined
  const text = raw.trim()
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  const quoted = /^'([\s\S]*)'$/.exec(text)
  if (quoted) return quoted[1]
  return undefined
}

/** Every prop's own default, then the demo's starting values on top. */
export function initialValues(
  meta: ComponentMeta,
  initial: Record<string, unknown> = {},
): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  for (const prop of meta.props) {
    const fallback = parseDefault(prop.default)
    if (fallback !== undefined) next[prop.name] = fallback
  }
  return Object.assign(next, initial)
}

export function isDefault(prop: PropMeta, value: unknown): boolean {
  const fallback = parseDefault(prop.default)
  if (fallback === undefined) return value === undefined || value === '' || value === false
  return value === fallback
}

function attributeFor(prop: PropMeta, value: unknown): string | null {
  if (isDefault(prop, value)) return null
  const kebab = prop.name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

  if (typeof value === 'boolean') return value ? kebab : `:${kebab}="false"`
  if (typeof value === 'number') return `:${kebab}="${value}"`
  if (typeof value === 'string') return `${kebab}="${value.replace(/"/g, '&quot;')}"`
  if (value === null || value === undefined) return null
  return `:${kebab}='${JSON.stringify(value)}'`
}

/**
 * The markup for a component with these prop values: only props that differ
 * from their default are printed, so the snippet is the minimum you need.
 */
export function generateCode(
  meta: ComponentMeta,
  values: Record<string, unknown>,
  slotCode: Record<string, string> = {},
): string {
  const attributes: string[] = []
  for (const prop of meta.props) {
    const attribute = attributeFor(prop, values[prop.name])
    if (attribute) attributes.push(attribute)
  }

  const named = Object.entries(slotCode).filter(([name]) => name !== 'default')
  const defaultBody = slotCode.default

  const open =
    attributes.length === 0
      ? `<${meta.tag}`
      : attributes.length === 1
        ? `<${meta.tag} ${attributes[0]}`
        : `<${meta.tag}\n  ${attributes.join('\n  ')}\n`

  if (!defaultBody && named.length === 0) {
    return attributes.length > 1 ? `${open}/>` : `${open} />`
  }

  const body: string[] = []
  if (defaultBody) body.push(...defaultBody.split('\n').map((line) => `  ${line}`))
  for (const [name, content] of named) {
    body.push(`  <template #${name}>`)
    body.push(...content.split('\n').map((line) => `    ${line}`))
    body.push('  </template>')
  }

  return `${open}>\n${body.join('\n')}\n</${meta.tag}>`
}
