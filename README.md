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

## Typography

The package ships **Inter** - the family every text style in the Figma file is
set in - and sets it on the page, not only on the components:

```ts
import 'evoq-ui/style.css' // tokens, components, the font, and `html { font-family }`
```

That is all the setup there is. The stylesheet pulls in `evoq-ui/fonts.css`,
which declares four self-hosted `@font-face` rules: latin and latin-ext, each
roman and italic, as variable fonts covering weight 100-900. Each face keeps
its `unicode-range`, so a browser fetches latin-ext only when a page actually
shows a character that needs it.

Self-hosted rather than loaded from Google Fonts on purpose: the library works
offline and on closed networks, sends no visitor IP to a third party, and
survives a strict Content-Security-Policy. The files add 427 kB to the package
(latin roman is the 71 kB a typical Indonesian or English page downloads).
Inter is under the SIL Open Font License 1.1, shipped as `dist/fonts/OFL.txt`.

**To use a different typeface**, re-point the token from your own stylesheet -
one line, and both the page and every component follow:

```scss
// main.scss, loaded anywhere in your app
:root {
  --ev-font-family-base: 'Plus Jakarta Sans', sans-serif;
}
```

Override the token rather than the `html` rule: components read the same token,
so this works whichever order the stylesheets happen to load in, and the Inter
files are then never downloaded - no `@font-face` in the page uses them.

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

The playground opens on a **Props Simulator**: pick any of the 81 components,
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

### Atomic structure

Components are organised by atomic level - `src/atoms`, `src/molecules`,
`src/organisms` and `src/patterns` (there is no screen layer; screens belong to
the apps that use this package). A layer may only import from the layers below
it, and ESLint fails any import that breaks that. The level is a source-tree
concern only: every component is exported flat from `evoq-ui`, so moving one
between layers never changes a consumer's import. The rules, and how to pick a
layer, are in [`AGENTS.md` §9](AGENTS.md).

### Adding a component

1. Create `src/<layer>/<name>/Ev<Name>.vue` in the right atomic layer.
2. Add `defineOptions({ name: 'Ev<Name>' })` so devtools and global registration agree.
3. Style with `ev-<name>` BEM classes in a **non-scoped** `<style lang="scss">` block,
   using only semantic `--ev-*` tokens — that is what makes the component themeable by
   consumers. For type, prefer the named Figma styles:
   `@use '../../styles/typography' as type; @include type.style('body/regular');`
4. Trace the values from that component's own page in Figma rather than inferring them
   from the token layer — the boards carry per-state specs the tokens do not.
5. Re-export it from that layer's barrel, e.g. [`src/atoms/index.ts`](src/atoms/index.ts).
6. Add `Ev<Name>.spec.ts` next to it, and a section in [`playground/App.vue`](playground/App.vue).

## Coverage

All 36 "ready" pages of the Figma file are ported. One is deliberately not a
component:

| Figma page | Why not a component                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Slot`     | Its documentation is guidance for **designers** on when to use a Figma slot versus a Variant or Instance Swap. Vue's own `<slot>` is the equivalent. |

`EvLogo` ships **both brand lockups in full** - the EVOQ mark, wordmark and
tagline, and the DataSea mark and wordmark - as five SVG files inlined at build
time, so a product never has to source the logo from somewhere else. Pass `src`
(or the default slot) to use a local asset instead, and `:tagline="false"` to
drop the strap line where it would be too small to read.

They cost 52.6 KB raw / 20.4 KB gzipped, and the tagline is 38.2 KB / 14.8 KB of
that on its own: it is outlined Playball script, since the font is not shipped
and a fallback would draw the wrong logo. Those bytes reach every consumer -
`:tagline="false"` and `src` change what renders, not what ships - because the
package is built as a single chunk today, so importing one component pulls the
whole bundle either way.

One more is partial by design:

- **`EvInput`** is the one field the Input page's seventeen sets are all built
  from. A search input is this with `type="search"` and a leading icon; a
  dropdown input is this beside `EvDropdownList`. `InputDate` / `InputTime`
  compose it with `EvCalendar`.

### On Progress pages

The 11 pages after the `🚧 On Progress ⬇️` separator are ported too, from the
boards **as they stand today**. They are built the same way as everything above

- traced node by node, with a `verify:figma` section and a spec of their own -
  so when a page is signed off the work is a diff against a known baseline rather
  than a port from scratch.

| Figma page                 | Components                                         |
| -------------------------- | -------------------------------------------------- |
| `Loading`                  | `EvLoading`                                        |
| `Item`                     | `EvItem`, `EvLabelItem`                            |
| `Toast`                    | `EvToast`                                          |
| `Hover Card`               | `EvHoverCard`                                      |
| `Dropdown Menu`            | `EvDropdownMenu`, `EvDropdownMenuItem`             |
| `Command`                  | `EvCommand`, `EvCommandGroup`, `EvCommandItem`     |
| `Pagination`               | `EvPagination`, `EvPaginationItem`                 |
| `Data Table`               | `EvDataTable`, `EvDataTableRow`, `EvDataTableCell` |
| `Empty`                    | `EvEmptyState`                                     |
| `Sidebar`                  | `EvSidebar`, `EvSidebarItem`                       |
| `Navigation Menu - Mobile` | `EvNavigationMenuMobile`, `EvNavMenuMobileItem`    |

What to re-check first when a board changes:

- **Off-system colours.** Pagination's captions are `#333f47` and the mobile
  nav's centre action is `#08a94c`; neither is in any EVOQ ramp, and both are
  asserted as literals. The Data Table's header label is `#4b5675` - grey/700
  in the library ramp, with no semantic token.
- **The deliberate deviations**, each commented in its component and asserted
  in its harness section: Toast flattens the board's two different nestings of
  the close button into one; `EvCommandItem` styles a Disabled state the board
  drew but never styled; the mobile nav draws its notch as a ring rather than a
  boolean cut-out; `EvEmptyState` keeps the rings, the badge and the copy and
  slots the per-variant artwork; the Sidebar's Sub Submenu indent is 24 on all
  four states, not 24/24/16/16 as drawn.
- **`EvLoading`'s animation.** The board's `./… Animation` sets are keyframes,
  not variants, so they are CSS animations here.

The Figma documentation prose for these pages is the usual mix - binding on
behaviour, unreliable on numbers. Its "Geist", `#292f37`, `#145bc3`, `#dbdde1`,
`#e7eff9` and the mobile bar's "56px" all disagree with the boards; the boards
won, as AGENTS.md section 6 requires.

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

## Component docs and MCP

Every component has one document and one **stable id**: `evoq-ui:<name>`, the
component name without its `Ev` prefix, in kebab case — `EvButton` is
`evoq-ui:button`, `EvNavMenuItem` is `evoq-ui:nav-menu-item`. The id does not
change when a component moves between atomic layers, so an agent or an
aggregator can hold on to it.

| Path                                  | What it is                                                                |
| ------------------------------------- | ------------------------------------------------------------------------- |
| [`docs/components/`](docs/components) | one Markdown doc per component, plus an index by layer                    |
| `docs/components/manifest.json`       | the same data as JSON — also importable as `evoq-ui/manifest.json`        |
| [`mcp/server.mjs`](mcp/server.mjs)    | an MCP server (Express, HTTP + SSE) that serves exactly those files by id |

Each doc carries the import line, every prop with its type, allowed values and
default, the slots, events and `v-model`s, where non-prop attributes land, what
the component is built from and what uses it, a copy-ready example, and the
binding Do / Don't rules from its Figma documentation frame — with the Figma
node ids, so a design reference is one lookup away.

**Nothing in them is written by hand.** `npm run docs:build` reads the props from
the SFCs, the example from the playground simulator, the composition from the
imports, and the guidance from a snapshot of the Figma docs
(`design/figma-component-docs.json`). Only the mapping to Figma and the search
keywords live in [`scripts/component-sources.mjs`](scripts/component-sources.mjs).
The build fails on anything it cannot source — including a pixel value in the
Figma prose that has not been checked against the board. `npm run docs:check`
fails when the committed docs are stale, and runs before every publish.

### Using the MCP server

Transport is **MCP over HTTP with Server-Sent Events**, on Express: the server
runs once — locally or deployed publicly — and any number of clients connect
to it, instead of each client spawning its own stdio process. Start it first:

```bash
npm run mcp                # in this repo — reads mcp/.env if present
npx evoq-ui-mcp             # in an app that installed evoq-ui
```

It listens on `http://0.0.0.0:4001` by default (`PORT` / `HOST`), and prints
its endpoints on startup. `cp mcp/.env.example mcp/.env` to set `PORT`, `HOST`,
an `API_KEY` for the server to require, or `DOCS_DIR` to point it at a
different doc set — every value is also a plain environment variable, which
always wins over `.env`. `API_KEY` is empty out of the box: the server runs
with **no authentication** until you set one.

| Endpoint              | Method | Auth                                 | What it does                                             |
| --------------------- | ------ | ------------------------------------ | -------------------------------------------------------- |
| `/health`             | GET    | none                                 | `{ status, name, version, components, auth }`            |
| `/sse`                | GET    | `x-api-key` header **or** `?apiKey=` | opens the event stream, announces `/messages?sessionId=` |
| `/messages?sessionId` | POST   | `x-api-key` header only              | one JSON-RPC 2.0 request or notification per call        |

The query-string key is accepted on `/sse` only, for clients that cannot set a
header on an SSE connection — `/messages` always needs the header.

```bash
curl http://localhost:4001/health

curl -N -H "x-api-key: <your-key>" http://localhost:4001/sse
# -> event: endpoint
#    data: /messages?sessionId=<session-id>

curl -X POST "http://localhost:4001/messages?sessionId=<session-id>" \
  -H "Content-Type: application/json" -H "x-api-key: <your-key>" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
# -> 202 Accepted; the actual reply arrives on the open /sse stream
```

In this repo, [`.mcp.json`](.mcp.json) registers the running server for any
MCP client that reads project config. In an app that installed `evoq-ui`, or
for a server deployed elsewhere, add it to that app's MCP config the same way:

```json
{
  "mcpServers": {
    "evoq-ui": {
      "url": "http://your-host:4001/sse",
      "headers": { "x-api-key": "your-secret-api-key" }
    }
  }
}
```

| Tool                | Use it to                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `list_components`   | list every id, filtered by layer                                                                                        |
| `search_components` | find ids by purpose — "date range", "confirm delete", "chip"                                                            |
| `get_component`     | fetch one doc by id (`format: "json"` for the manifest entry); unknown ids are reported, never swapped for a near match |

Resources: `evoq-ui://manifest`, `evoq-ui://components` (the index) and
`evoq-ui://components/{name}` for each doc.

## Build output

| File               | Purpose                       |
| ------------------ | ----------------------------- |
| `dist/evoq-ui.js`  | ESM bundle                    |
| `dist/evoq-ui.cjs` | CommonJS bundle               |
| `dist/evoq-ui.css` | All component styles + tokens |
| `dist/index.d.ts`  | Type declarations (entry)     |

## Publishing

The package starts at **`1.0.0`** as its first stable release, and follows
[Semantic Versioning](https://semver.org/) from there: `MAJOR.MINOR.PATCH`.
Bumping a segment always resets everything to its right to `0` - `npm version
minor` on `1.2.5` gives `1.3.0`, `npm version major` on `1.3.0` gives `2.0.0`.

### Choosing a version bump

| Bump  | Command             | Example           | When                                                                                                                                                                   |
| ----- | ------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Patch | `npm version patch` | `1.0.0` → `1.0.1` | A bug fix, or a styling/visual tweak that changes no prop, slot, event or exported type - nothing a consumer's code has to react to.                                   |
| Minor | `npm version minor` | `1.0.0` → `1.1.0` | A backward-compatible addition - a new component, a new prop/slot/event, a new optional variant. Existing consumer code keeps working.                                 |
| Major | `npm version major` | `1.0.0` → `2.0.0` | A breaking change - a prop/slot/event/exported type removed or changed incompatibly, a changed default that alters existing output, or a component removed or renamed. |

When in doubt, ask: "does code that already imports this package still compile
and render the same way after this update?" Yes → patch or minor depending on
whether anything was added. No → major.

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) publishes to
npm automatically on every merge to `main`:

1. Bump the version as part of your change (or in a follow-up merge), picking
   the bump from the table above:
   ```bash
   npm version patch   # or minor / major
   ```
2. Merge to `main`. The workflow runs the full verification suite - typecheck,
   build, `verify:figma`, tests, lint, `docs:check`, `build:playground` -
   exactly as in [Development](#development) above.
3. If that version is not already on the registry, it publishes with
   provenance and pushes a `vX.Y.Z` tag. **A merge that does not bump the
   version still runs the suite, then simply skips the publish step** - it is
   always safe to merge to `main` without releasing.

It needs a repository secret `NPM_TOKEN` - an npm **Automation** token (so it
publishes with no interactive 2FA/OTP prompt), added under the repo's
**Settings → Secrets and variables → Actions**. Never commit a token or paste
one into an issue, PR or chat; if one is ever exposed that way, revoke it on
npmjs.com immediately and issue a new one.

Publishing by hand still works the same way it always has, for a one-off
release outside CI:

```bash
npm version patch   # or minor / major
npm publish         # `prepublishOnly` runs typecheck + build + docs:check
```
