<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PlaygroundCodeSnippet from './PlaygroundCodeSnippet.vue'
import { COMPONENT_PROPS, type PropMeta } from '../component-props'
import { SIMULATOR_DEMOS } from '../simulator-demos'
import * as EvoqComponents from '../../src'
import * as EvoqCharts from '../../src/charts'

/**
 * The props simulator: pick a value for every prop the component declares, see
 * the result live, and copy the exact markup that produced it.
 *
 * The prop list is generated from the SFCs (`scripts/extract-props.mjs`), so it
 * cannot go stale; only the slot content beside it is hand-authored.
 */

const props = defineProps<{ tag: string }>()

const REGISTRY = { ...EvoqComponents, ...EvoqCharts } as Record<string, unknown>

const meta = computed(() => COMPONENT_PROPS[props.tag])
const demo = computed(() => SIMULATOR_DEMOS[props.tag] ?? {})
const target = computed(() => REGISTRY[props.tag])

/** Props that can actually be driven from the panel, in declaration order. */
const controllable = computed(() => (meta.value?.props ?? []).filter((p) => p.control !== 'none'))

/** Parse a `withDefaults` literal back into a real value. */
function parseDefault(raw: string | undefined): unknown {
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

const values = ref<Record<string, unknown>>({})

/** Rebuild the panel whenever the simulated component changes. */
watch(
  () => props.tag,
  () => {
    const next: Record<string, unknown> = {}
    for (const prop of meta.value?.props ?? []) {
      const fallback = parseDefault(prop.default)
      if (fallback !== undefined) next[prop.name] = fallback
    }
    Object.assign(next, demo.value.initial ?? {})
    values.value = next
  },
  { immediate: true },
)

/** Only send props that hold a value - undefined would override a default. */
const bound = computed(() => {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values.value)) {
    if (value !== undefined && value !== '') out[key] = value
  }
  return out
})

/** Keep the preview interactive: write `update:x` straight back into the panel. */
const listeners = computed(() => {
  const out: Record<string, (value: unknown) => void> = {}
  for (const emit of meta.value?.emits ?? []) {
    if (!emit.name.startsWith('update:')) continue
    const key = emit.name.slice('update:'.length)
    out[`onUpdate:${key}`] = (value: unknown) => {
      values.value = { ...values.value, [key]: value }
    }
  }
  return out
})

const slots = computed(() => demo.value.slots ?? {})

function reset() {
  const next: Record<string, unknown> = {}
  for (const prop of meta.value?.props ?? []) {
    const fallback = parseDefault(prop.default)
    if (fallback !== undefined) next[prop.name] = fallback
  }
  Object.assign(next, demo.value.initial ?? {})
  values.value = next
}

// ------------------------------------------------------------------ code gen

function isDefault(prop: PropMeta, value: unknown): boolean {
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

const generatedCode = computed(() => {
  const info = meta.value
  if (!info) return ''

  const attributes: string[] = []
  for (const prop of info.props) {
    const attribute = attributeFor(prop, values.value[prop.name])
    if (attribute) attributes.push(attribute)
  }

  const slotCode = demo.value.slotCode ?? {}
  const named = Object.entries(slotCode).filter(([name]) => name !== 'default')
  const defaultBody = slotCode.default

  const open =
    attributes.length === 0
      ? `<${info.tag}`
      : attributes.length === 1
        ? `<${info.tag} ${attributes[0]}`
        : `<${info.tag}\n  ${attributes.join('\n  ')}\n`

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

  return `${open}>\n${body.join('\n')}\n</${info.tag}>`
})

const stage = computed(() => demo.value.stage ?? 'default')
const activeCount = computed(
  () => meta.value?.props.filter((p) => !isDefault(p, values.value[p.name])).length ?? 0,
)

const showAllProps = ref(false)
const visibleProps = computed(() => {
  const all = meta.value?.props ?? []
  return showAllProps.value ? all : all.slice(0, 8)
})
</script>

<template>
  <div v-if="meta" class="pg-sim">
    <!-- ------------------------------------------------------------ header -->
    <div class="pg-sim__head">
      <div>
        <h3 class="pg-sim__title">{{ meta.tag }}</h3>
        <p class="pg-sim__file">{{ meta.file }}</p>
      </div>
      <div class="pg-sim__head-actions">
        <span class="pg-sim__count">
          {{ activeCount }} dari {{ meta.props.length }} props diubah
        </span>
        <button type="button" class="pg-sim__reset" @click="reset">Kembalikan</button>
      </div>
    </div>

    <p v-if="demo.note" class="pg-sim__note">{{ demo.note }}</p>

    <div class="pg-sim__grid">
      <!-- ----------------------------------------------------------- stage -->
      <div class="pg-sim__stage" :class="`pg-sim__stage--${stage}`">
        <component :is="target" v-bind="{ ...bound, ...listeners }">
          <template v-for="(render, name) in slots" #[name] :key="name">
            <component :is="render" />
          </template>
        </component>
      </div>

      <!-- -------------------------------------------------------- controls -->
      <div class="pg-sim__panel">
        <h4 class="pg-sim__panel-title">Kontrol Props</h4>

        <p v-if="controllable.length === 0" class="pg-sim__empty">
          Komponen ini tidak punya prop sederhana untuk disimulasikan.
        </p>

        <div v-for="prop in controllable" :key="prop.name" class="pg-sim__control">
          <label class="pg-sim__label" :for="`sim-${meta.tag}-${prop.name}`">
            {{ prop.name }}
            <code class="pg-sim__type">{{ prop.type }}</code>
          </label>

          <select
            v-if="prop.control === 'select'"
            :id="`sim-${meta.tag}-${prop.name}`"
            v-model="values[prop.name]"
            class="pg-sim__input"
          >
            <option v-for="option in prop.options" :key="String(option)" :value="option">
              {{ option }}
            </option>
          </select>

          <label
            v-else-if="prop.control === 'boolean'"
            class="pg-sim__switch"
            :for="`sim-${meta.tag}-${prop.name}`"
          >
            <input
              :id="`sim-${meta.tag}-${prop.name}`"
              v-model="values[prop.name]"
              type="checkbox"
            />
            <span>{{ values[prop.name] ? 'true' : 'false' }}</span>
          </label>

          <input
            v-else-if="prop.control === 'number'"
            :id="`sim-${meta.tag}-${prop.name}`"
            v-model.number="values[prop.name]"
            type="number"
            class="pg-sim__input"
          />

          <input
            v-else
            :id="`sim-${meta.tag}-${prop.name}`"
            v-model="values[prop.name]"
            type="text"
            class="pg-sim__input"
            :placeholder="prop.default ?? '—'"
          />
        </div>
      </div>
    </div>

    <!-- -------------------------------------------------------------- code -->
    <PlaygroundCodeSnippet
      :code="generatedCode"
      title="Kode dari simulasi ini"
      :default-expanded="true"
    />

    <!-- ------------------------------------------------------------ tables -->
    <div class="pg-sim__tables">
      <div class="pg-sim__table-block">
        <h4 class="pg-sim__panel-title">Props ({{ meta.props.length }})</h4>
        <table class="pg-sim__table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Tipe</th>
              <th>Default</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="prop in visibleProps" :key="prop.name">
              <td>
                <code>{{ prop.name }}</code>
                <span v-if="prop.required" class="pg-sim__required" title="Wajib diisi">*</span>
              </td>
              <td>
                <code class="pg-sim__type">{{ prop.type }}</code>
              </td>
              <td>
                <code v-if="prop.default">{{ prop.default }}</code>
                <span v-else class="pg-sim__muted">—</span>
              </td>
              <td>
                <span v-if="prop.description">{{ prop.description }}</span>
                <span v-else class="pg-sim__muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <button
          v-if="meta.props.length > 8"
          type="button"
          class="pg-sim__reset"
          @click="showAllProps = !showAllProps"
        >
          {{ showAllProps ? 'Ringkas' : `Tampilkan ${meta.props.length - 8} props lainnya` }}
        </button>
      </div>

      <div v-if="meta.slots.length" class="pg-sim__table-block">
        <h4 class="pg-sim__panel-title">Slots ({{ meta.slots.length }})</h4>
        <table class="pg-sim__table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="slot in meta.slots" :key="slot.name">
              <td>
                <code>{{ slot.name }}</code>
              </td>
              <td>
                <span v-if="slot.description">{{ slot.description }}</span>
                <span v-else class="pg-sim__muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="meta.emits.length" class="pg-sim__table-block">
        <h4 class="pg-sim__panel-title">Events ({{ meta.emits.length }})</h4>
        <table class="pg-sim__table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in meta.emits" :key="event.name">
              <td>
                <code>{{ event.name }}</code>
              </td>
              <td>
                <span v-if="event.description">{{ event.description }}</span>
                <span v-else class="pg-sim__muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <p v-else class="pg-sim__empty">Komponen "{{ tag }}" tidak ada di katalog props.</p>
</template>

<style lang="scss">
.pg-sim {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--ev-text-primary);
  }

  &__file {
    margin: 2px 0 0;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: var(--ev-text-secondary);
  }

  &__head-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__count {
    font-size: 12px;
    color: var(--ev-text-secondary);
  }

  &__reset {
    padding: 6px 12px;
    border: 1px solid var(--ev-border-primary);
    border-radius: 6px;
    background: var(--ev-bg-primary);
    color: var(--ev-text-primary);
    font-size: 12px;
    cursor: pointer;

    &:hover {
      background: var(--ev-bg-secondary);
    }
  }

  &__note {
    margin: 0;
    padding: 8px 12px;
    border-left: 3px solid var(--ev-brand-primary);
    background: var(--ev-bg-secondary);
    color: var(--ev-text-secondary);
    font-size: 13px;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 300px;
    gap: 16px;

    @media (max-width: 900px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  &__stage {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 160px;
    padding: 24px;
    border: 1px dashed var(--ev-border-primary);
    border-radius: 12px;
    background: var(--ev-bg-primary);
    overflow: auto;

    > * {
      max-width: 100%;
    }

    &--wide > *,
    &--tall > * {
      width: 100%;
    }

    &--tall {
      min-height: 340px;
      align-items: flex-start;
    }

    &--dark {
      background: var(--ev-bg-inverse, #3e424a);
    }
  }

  &__panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border: 1px solid var(--ev-border-primary);
    border-radius: 12px;
    background: var(--ev-bg-secondary);
    max-height: 520px;
    overflow-y: auto;
  }

  &__panel-title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ev-text-secondary);
  }

  &__control {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--ev-text-primary);
  }

  &__type {
    font-family: ui-monospace, monospace;
    font-size: 10px;
    font-weight: 400;
    color: var(--ev-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  &__input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--ev-border-primary);
    border-radius: 6px;
    background: var(--ev-bg-primary);
    color: var(--ev-text-primary);
    font-size: 13px;
  }

  &__switch {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: ui-monospace, monospace;
    font-size: 12px;
    color: var(--ev-text-secondary);
    cursor: pointer;
  }

  &__tables {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__table-block {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th,
    td {
      padding: 8px 10px;
      border-bottom: 1px solid var(--ev-border-primary);
      text-align: left;
      vertical-align: top;
    }

    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--ev-text-secondary);
      background: var(--ev-bg-secondary);
    }

    code {
      font-family: ui-monospace, monospace;
      font-size: 12px;
    }
  }

  &__required {
    margin-left: 2px;
    color: var(--ev-ext-error);
  }

  &__muted {
    color: var(--ev-text-tertiary);
  }

  &__empty {
    margin: 0;
    font-size: 13px;
    color: var(--ev-text-secondary);
  }
}
</style>
