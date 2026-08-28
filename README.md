# Evoq UI

Design system components for Vue 3, published as an npm package.

## Install

```bash
npm install evoq-ui vue
```

`vue` is a **peer dependency** — the library never bundles it.

## Usage

Register everything globally:

```ts
import { createApp } from 'vue'
import EvoqUI from 'evoq-ui'
import 'evoq-ui/style.css'
import App from './App.vue'

createApp(App).use(EvoqUI).mount('#app')
```

Or import only what you use (tree-shakeable, recommended):

```vue
<script setup lang="ts">
import { EvButton } from 'evoq-ui'
import 'evoq-ui/style.css'
</script>

<template>
  <EvButton variant="primary" size="default" @click="save">Simpan</EvButton>
</template>
```

## Theming

Tokens are scraped from the **EVOQ - Design System** Figma file and layered the way
Figma layers them (see [`src/styles/`](src/styles/) and the raw scrape in
[`design/figma-introduction-tokens.json`](design/figma-introduction-tokens.json)):

| Layer         | File                  | What it holds                                    |
| ------------- | --------------------- | ------------------------------------------------ |
| Primitives    | `_primitives.scss`    | 83 raw palette steps across 8 ramps              |
| Library ramps | `_library-ramps.scss` | `blue`, `orange`, `teal`, ... from the library   |
| Brand         | `_brand.scss`         | `brand/primary/*`, `brand/secondary/*`, 4 themes |
| Semantic      | `_semantic.scss`      | 63 role tokens, light + dark                     |
| Scales        | `_scales.scss`        | spacing, radius, stroke, type scale              |
| Elevation     | `_elevation.scss`     | the 8 effect styles                              |

**Components only ever read the semantic layer** — `--ev-bg-*`, `--ev-text-*`,
`--ev-icon-*`, `--ev-border-*`, `--ev-brand-*`, `--ev-ext-*`, `--ev-tree-*`. Everything
resolves through CSS custom properties, so any layer can be re-pointed at runtime
without a rebuild:

```css
:root {
  --ev-brand-primary: #0ea5e9;
  --ev-radius-xs: 8px;
  --ev-font-family-base: 'Inter', sans-serif;
}
```

Dark mode ships built in:

```html
<html data-ev-theme="dark">
  <!-- or follow the OS -->
  <html data-ev-theme="auto"></html>
</html>
```

So do the four brand themes from the Figma `Brand` collection — switching one
attribute re-points every brand token in the system:

```html
<html data-ev-brand="blue">
  <!-- blue (default) | lightblue | green | orange -->
</html>
```

## Development

```bash
npm install
npm run dev        # playground at http://localhost:5173
npm run test       # vitest
npm run typecheck  # vue-tsc
npm run lint
npm run build      # typecheck + build to dist/
npm run verify:figma   # after a build: check dist CSS against the Figma spec
npm run build:playground   # build index.html + the playground for real
npm run extract:props      # regenerate the playground's props catalogue
```

### Props simulator

The playground opens on a **Props Simulator**: pick any of the 54 components,
drive every prop from a control panel, watch the preview update, and copy the
exact markup that produced it. Only props that differ from their default are
printed, so the snippet stays the minimum you need.

Its props / slots / events tables are generated from the SFCs by
[`scripts/extract-props.mjs`](scripts/extract-props.mjs) into
`playground/component-props.ts` - never hand-edit that file. The script runs
automatically before `dev` and `build:playground`, so a renamed prop shows up in
the tables on the next run rather than quietly going stale.

### Porting a component from Figma

[`AGENTS.md`](AGENTS.md) is the rulebook: how to scrape the file, how Figma auto
layout maps onto CSS, how a board hex resolves to a semantic token, which API
traps to expect, and the defects that have shipped before because someone
skipped a step.

`npm run build` runs in **library mode** and only ever compiles `src/index.ts` -
it never touches `index.html` or `playground/`. A playground that fails to
render therefore still builds clean, which is what `build:playground` is for.

`vue` is pinned to the exact floor of the `peerDependencies` range (`3.5.0`), so
typecheck and tests fail here if a component reaches for a newer API instead of
passing locally and breaking in a consumer's app. Raising the floor is a
deliberate change to both fields at once.

### Figma parity

[`scripts/verify-figma.mjs`](scripts/verify-figma.mjs) reads the **built**
stylesheet, resolves every `var()` chain through the token layers and the
component-level custom properties, and compares the result to the values traced
from each component's Figma board. Reading the SCSS proves nothing - the token
layer is four levels of indirection deep, so a wrong alias still compiles to
valid CSS that renders the wrong colour.

A component is not done until it has a section there and that section passes.

### Adding a component

1. Create `src/components/<name>/Ev<Name>.vue`.
2. Add `defineOptions({ name: 'Ev<Name>' })` so devtools and global registration agree.
3. Style with `ev-<name>` BEM classes in a **non-scoped** `<style lang="scss">` block,
   using only semantic `--ev-*` tokens — that is what makes the component themeable by
   consumers. For type, prefer the named Figma styles:
   `@use '../../styles/typography' as type; @include type.style('body/regular');`
4. Trace the values from that component's own page in Figma rather than inferring them
   from the token layer — the boards carry per-state specs the tokens do not.
5. Re-export it from [`src/components/index.ts`](src/components/index.ts).
6. Add `Ev<Name>.spec.ts` next to it, and a section in [`playground/App.vue`](playground/App.vue).

## Coverage

All 36 "ready" pages of the Figma file are ported. Two are deliberately not
components:

| Figma page        | Why not a component                                                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Slot`            | Its documentation is guidance for **designers** on when to use a Figma slot versus a Variant or Instance Swap. Vue's own `<slot>` is the equivalent. |
| `Logo` (wordmark) | The full lockup exports to 107KB of SVG - the wordmark is outlined text. `EvLogo` ships the 2.2KB mark; put your own wordmark in its default slot.   |

One more is partial by design:

- **`EvInput`** is the one field the Input page's seventeen sets are all built
  from. A search input is this with `type="search"` and a leading icon; a
  dropdown input is this beside `EvDropdownList`. `InputDate` / `InputTime`
  compose it with `EvCalendar`.

The 11 pages after the `🚧 On Progress ⬇️` separator are out of scope.

## Charts

Charts live behind a **separate entry point** and an **optional** peer
dependency, so a consumer who never draws a chart neither installs nor bundles
the chart engine:

```bash
npm i evoq-ui                       # no chart engine
npm i evoq-ui @unovis/vue @unovis/ts  # with charts
```

```vue
<script setup>
import { EvChart } from 'evoq-ui'
import { EvBarChart } from 'evoq-ui/charts'
</script>

<template>
  <EvChart title="Pendapatan" subtext="Jan – Des 2025">
    <EvBarChart
      :data="data"
      category="bulan"
      :series="['realisasi', 'target']"
      label="Realisasi terhadap target"
    />
  </EvChart>
</template>
```

`EvChart` is the container from the board — titled surface, KPI row, legend rail
— and takes any chart in its slot, including one you write yourself. `EvBarChart`
(grouped and stacked), `EvLineChart` (line and area) and `EvPieChart` (pie,
doughnut, doughnut-rounded) wrap [Unovis](https://unovis.dev) to cover every type
the board draws.

### Why an SVG engine

Unovis renders SVG, so its colours are CSS. The components map the EVOQ tokens
onto Unovis's own variables (`--vis-color0` → `--ev-chart-series-1` → the
semantic layer), which means a chart follows `data-ev-theme` and `data-ev-brand`
**with no JavaScript, no watcher and no re-render**:

|                        | series 1  | series 4  | tooltip   |
| ---------------------- | --------- | --------- | --------- |
| brand `blue` (default) | `#1b84ff` | `#c54a16` | `#3e424a` |
| brand `green`          | `#17c653` | `#0d9488` | `#3e424a` |
| brand `orange`         | `#c54a16` | `#f8285a` | `#3e424a` |
| `dark` + `green`       | `#45d175` | `#3ed8ca` | `#ebedf1` |

A canvas engine cannot read a CSS variable, so the same behaviour would have
meant resolving every colour through `getComputedStyle` and redrawing on every
theme or brand change. That is the reason for the choice.

The five series colours come from the `PieChart` board, and each is already a
semantic token — `brand/primary`, `ext/success`, `ext/warning`,
`brand/secondary`, `ext/error`. Override `--ev-chart-series-1..10` to re-point
them.

## Build output

| File               | Purpose                       |
| ------------------ | ----------------------------- |
| `dist/evoq-ui.js`  | ESM bundle                    |
| `dist/evoq-ui.cjs` | CommonJS bundle               |
| `dist/evoq-ui.css` | All component styles + tokens |
| `dist/index.d.ts`  | Type declarations (entry)     |

## Publishing

```bash
npm version patch   # or minor / major
npm publish         # `prepublishOnly` runs typecheck + build
```
