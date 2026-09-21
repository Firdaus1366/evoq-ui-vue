<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PlaygroundCodeSnippet from './PlaygroundCodeSnippet.vue'
import { COMPONENT_PROPS } from '../component-props'
import { generateCode, initialValues, isDefault } from '../simulator-code'
import { SIMULATOR_DEMOS, type SimulatorContext } from '../simulator-demos'
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

const values = ref<Record<string, unknown>>({})

/** Scratch state for demo slots that is not a prop - see `context` below. */
const demoState = reactive<Record<string, unknown>>({})

/** Rebuild the panel whenever the simulated component changes. */
watch(
  () => props.tag,
  () => {
    for (const key of Object.keys(demoState)) delete demoState[key]
    values.value = meta.value ? initialValues(meta.value, demo.value.initial) : {}
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

/**
 * What a demo slot may read and write: the panel's prop values, plus a scratch
 * `state` for things that are not props (the calendar's chosen Date). A picker
 * in a field's slot uses it to fill the field and close it, as a consumer would.
 */
const context = computed<SimulatorContext>(() => ({
  values: values.value,
  state: demoState,
  set: (key, value) => {
    values.value = { ...values.value, [key]: value }
  },
}))

function reset() {
  values.value = meta.value ? initialValues(meta.value, demo.value.initial) : {}
}

// ------------------------------------------------------------------ code gen
// The generator lives in `../simulator-code` - the component docs print with it too.

const generatedCode = computed(() =>
  meta.value ? generateCode(meta.value, values.value, demo.value.slotCode) : '',
)

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
        <div class="pg-sim__title-row">
          <h3 class="pg-sim__title">{{ meta.tag }}</h3>
          <span class="pg-sim__layer" :class="`pg-sim__layer--${meta.layer}`">{{
            meta.layer
          }}</span>
        </div>
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
            <component :is="() => render(context)" />
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

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: var(--ev-text-primary);
  }

  /* Atomic level, read off the source folder by extract-props. */
  &__layer {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    background-color: var(--ev-bg-subtle);
    color: var(--ev-text-secondary);

    &--atom {
      background-color: var(--ev-brand-primary-subtle);
      color: var(--ev-brand-primary);
    }
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
