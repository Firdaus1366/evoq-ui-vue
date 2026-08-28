# AGENTS.md — porting EVOQ from Figma

Instructions for any AI agent building or changing a component in this repo.

The single rule everything else serves: **a component is a translation of a
Figma node, not an interpretation of a screenshot.** Every number, every colour,
every element in the DOM must trace back to a node you actually read. If you
cannot point at the node, you invented it — and inventions are the only defects
this project has ever shipped.

File naming note: Claude Code also reads `CLAUDE.md`; other agents read
`AGENTS.md`. This is the one source of truth — if you add `CLAUDE.md`, make it a
one-line pointer here rather than a second copy.

---

## 0. What has actually gone wrong before

Read this first. Every item below shipped, passed a green test suite, and passed
a 1000-check parity run. None was caught by anything except a node-tree audit.

| Defect                                                                                  | Why it survived                                                                         |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `EvRichEditor` drew the toolbar **above** the field; the board puts it **below**        | parity checks values, never order                                                       |
| `EvRichEditor`, `EvTextarea`, `EvInputWithLabel` each drew a **notched floating label** | of six `Input*` sets only `InputField` has that node — the pattern was copied, not read |
| `EvInputFieldUnit` merged two inputs into one bordered box with a grey block            | the board draws a bare row of two independent inputs, gap 4                             |
| Harness asserted `#f9f9f9` for a toolbar/addon/wrap fill                                | that hex exists on no board; a fabricated value was locked in as if traced              |
| `EvCard` title 14px Medium                                                              | the board says 16px Bold — and the harness had the wrong number too, so it passed       |
| `EvInputSearch` 40px tall                                                               | the board says 44; the _documentation prose_ said 40 and was wrong                      |
| Tooltip fixed at `width: 320px`                                                         | faithful to the board, but overflowed its container on `placement="left"`               |

Pattern: **structure is invented far more often than colour is mistyped.**
Budget your effort accordingly.

---

## 1. Getting connected

The Figma MCP bridge is `figma-console`. Its server binds one of ports
9223–9232.

```
mcp__figma-console__figma_get_status  { probe: true }
```

- `setup.valid: true` and `probeResult.success: true` → you are connected.
- `EADDRINUSE ... All WebSocket ports 9223-9232 are in use` → stale servers from
  earlier sessions hold every port. Killing them frees the ports, **but this
  session's server caches its startup error and will not retry** — the user must
  restart the client. Say so plainly instead of retrying `figma_reconnect`.
- Killing another session's server disconnects that session. Ask first.

The connection can drop mid-session and silently come back on a different port.
If a call fails with "Cannot connect", re-probe before concluding anything.

File: **EVOQ - Design System**, key `hJ3XmwLptPtF4IFBDlZlpx`.

---

## 2. Scraping rules (`figma_execute`)

Everything is done through `figma_execute`. Always begin with:

```js
await figma.loadAllPagesAsync()
```

Without it, `figma.root.children` gives you page stubs with no children.

### 2.1 API traps that will cost you an hour each

| Trap                           | What happens                                                                               | Do this                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `node.mainComponent`           | throws under `documentAccess: dynamic-page`                                                | `await node.getMainComponentAsync()`                                                    |
| `figma.mixed`                  | `cornerRadius`, `strokeWeight`, `fontName`, `lineHeight`, `fills` can all be `figma.mixed` | test `=== figma.mixed` before reading, fall back to the per-corner / per-side fields    |
| `componentPropertyDefinitions` | throws `Component set has existing errors` on a broken set (`.TabItem` is broken today)    | wrap in `try/catch`, fall back to `variantGroupProperties`                              |
| `findAllWithCriteria`          | returns hidden nodes too                                                                   | walk `parent` up to the variant root and reject if any ancestor has `visible === false` |
| `=>` inside a generic          | a naive `<`/`>` bracket matcher stops at the `>` of `() => unknown`                        | skip a `>` whose previous char is `=`                                                   |
| Fill opacity                   | `fills[0].opacity` is separate from `node.opacity`                                         | read both; the board's slider track is `#64748b` at 25% = `#64748b40`                   |

### 2.2 Payload discipline

A component set can hold 160 variants. Dumping them raw will blow your context.

- **Deduplicate by signature.** Build a compact string per variant, group
  identical ones, return `{ sig, example, count }`. A 112-variant Button
  collapses to ~15 rows and you lose nothing.
- **Key results by node id, never by name.** Frames are routinely both named
  `Documentation`; keying by name silently drops one.
- **Slice long strings** in the returned object, not after.
- Ask for depth 1–2 first, go deeper only where the diff is.

### 2.3 The order of operations — structure before pixels

1. **Node tree.** Names, `layoutMode`, `itemSpacing`, padding, `visible`, in
   order. Nothing else.
2. **Diff it against the component's DOM**, element for element.
3. Only once the hierarchy matches, read geometry and colour.

Reversing this is how the toolbar ended up above the field with all its colours
correct.

---

## 3. Node → CSS mapping

### 3.1 Auto layout

| Figma                                | CSS                                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `layoutMode: VERTICAL`               | `display: flex; flex-direction: column`                                             |
| `layoutMode: HORIZONTAL`             | `display: flex; flex-direction: row`                                                |
| `itemSpacing`                        | `gap`, exact px                                                                     |
| `counterAxisSpacing` (when wrapping) | `row-gap` — it does **not** always equal `itemSpacing`                              |
| `layoutWrap: WRAP`                   | `flex-wrap: wrap`                                                                   |
| `paddingTop/Right/Bottom/Left`       | `padding`, per side, never rounded or symmetrised                                   |
| `primaryAxisAlignItems`              | `justify-content` (`MIN`→`flex-start`, `CENTER`, `MAX`→`flex-end`, `SPACE_BETWEEN`) |
| `counterAxisAlignItems`              | `align-items` (`MIN`→`flex-start`, `CENTER`, `MAX`→`flex-end`, `BASELINE`)          |
| `layoutSizingHorizontal: FILL`       | `width: 100%` or `flex: 1 1 0%`                                                     |
| `layoutSizingHorizontal: HUG`        | `width: fit-content`                                                                |
| `layoutSizingHorizontal: FIXED`      | exact `width` in px                                                                 |
| `clipsContent`                       | `overflow: hidden` (or `auto` when the board means "scrolls")                       |

Asymmetric padding is a signal, not sloppiness. `InputWithLabel` pads
`0,8,0,0` on the L-Label variant precisely so the addon sits flush against the
border. Symmetrising it breaks the design.

### 3.2 Box model

`box-sizing: border-box` on everything. Then a Figma `strokeAlign: INSIDE` is
just a `border` — the outer dimension stays put.

| `strokeAlign` | CSS                                                                |
| ------------- | ------------------------------------------------------------------ |
| `INSIDE`      | `border: Npx solid <colour>` with `border-box`                     |
| `OUTSIDE`     | `box-shadow: 0 0 0 Npx <colour>`                                   |
| `CENTER`      | usually a rule/line node — render as a sized element, not a border |

`cornerRadius === figma.mixed` means per-corner radii. Read
`topLeftRadius / topRightRadius / bottomRightRadius / bottomLeftRadius` and emit
them individually — the `InputWithLabel` addon is `6/0/0/6` on the left and
`0/6/6/0` on the right.

### 3.3 Effects

```
box-shadow: <offset.x>px <offset.y>px <radius>px <spread>px <color>
```

Prefer the named elevation tokens in `src/styles/_elevation.scss` when the
shadow matches one — the harness checks the signature (`10px 15px -3px` is
`elevation/lg`).

---

## 4. Colour rules

**Components read the semantic layer only.** Never a primitive, never a raw hex,
unless the value is genuinely off-system (§4.3).

```
primitives → library ramps → brand → semantic → component
```

### 4.1 Resolving a board hex to a token

1. Read the hex off the node.
2. Find it in `design/figma-introduction-tokens.json` (`semantic` section).
3. Use the semantic token: `#78829d` → `var(--ev-text-secondary)`.
4. If it maps to several tokens, pick by **role**, not by value —
   `#ebedf1` is `bg/subtle`, `#d7dbe3` is `bg/subtler`, and the disabled addon
   genuinely steps from one to the other.

Getting this right is what makes `data-ev-theme` and `data-ev-brand` work with
no JavaScript. A hardcoded hex silently opts the component out of dark mode and
all four brand themes.

### 4.2 State colours belong on custom properties

```scss
.ev-thing {
  --ev-thing-border: var(--ev-border-secondary);
  border: 1px solid var(--ev-thing-border);

  &--error {
    --ev-thing-border: var(--ev-ext-error);
  }
  &--disabled {
    --ev-thing-border: var(--ev-border-primary);
  }
}
```

This is also what lets the harness resolve a state without simulating it.

### 4.3 Off-system colours

Some boards paint hexes that exist in no EVOQ ramp. Verify before mapping, then
assert the literal and say why in a comment:

- Slider track `#64748b40` (Tailwind slate-500 at 25%) and destructive `#991515`
- Avatar's six tints are radial gradients whose stops are in no ramp

Do **not** "round" these to the nearest token.

### 4.4 Do not invent a colour

If a hex appears in no board and in no ramp, you made it up. `#f9f9f9` was
locked into three harness sections for an addon fill that is actually `#ebedf1`.

---

## 5. Typography

Read `fontSize`, `fontName.style`, `lineHeight`, `letterSpacing` off the actual
`TEXT` node. Then prefer the named style:

```scss
@use '../../styles/typography' as type;
@include type.style('body/regular'); // 14 / 16 / 500
@include type.style('subheading/h6'); // 16 / 20 / 700
```

The scale lives in `src/styles/_typography.scss`. `body/regular` is by far the
most common and by far the most over-applied — `EvCard`'s title was wrong for
exactly this reason.

The boards render **Inter**. Documentation prose that says "Geist" is wrong;
check the text node, not the paragraph describing it.

---

## 6. Documentation frames

Every component page carries a `Documentation — <Name>` frame holding rules the
boards cannot draw: when to use it, Do/Don't, per-property guidance, anatomy.

Extract by walking the frame for `TEXT` nodes and sorting by
`absoluteBoundingBox.y`, then `x`.

**Treat its behavioural rules as binding. Treat its numbers as suspect.** Where
the prose and the board disagree, the board wins. Confirmed prose errors:

| Component       | Prose says                         | Board says                          |
| --------------- | ---------------------------------- | ----------------------------------- |
| Kbd             | radius 4, `#f4f5f6` / `#3c4450`    | radius **6**, `#ebedf1` / `#5e626f` |
| Tooltip         | `#292f37`                          | `#3e424a`                           |
| Scroll          | track `#c1c6cd`, thumb `#98a2b0`   | `#dbdfe9`, `#c4cada`                |
| Modal           | footer `#f4f5f6`                   | `#ebedf1`                           |
| Navigation Menu | bar 56px                           | **72px**                            |
| InputSearch     | compact 40px                       | **44px**                            |
| Toggle          | "both turn brand-blue when active" | Outline active is `#d7dbe3`         |

Thirteen pages also carry an older `<Name> — Usage Doc` frame stamped `v1.1.0`.
It is stale — `Button — Usage Doc` lists five variants where the set defines
seven. Read `Documentation — <Name>` and the set's own
`componentPropertyDefinitions`; ignore `— Usage Doc` unless it is the only frame.

---

## 7. Mapping component properties to a Vue API

| Figma property type                           | Vue                                                                              |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `VARIANT` (visual)                            | a `variant` / `size` prop typed as a union in `src/types.ts`                     |
| `VARIANT` named `State`                       | **not** a prop — CSS states (`:hover`, `:active`, `:disabled`) or a `modelValue` |
| `BOOLEAN` `Has X`                             | a boolean prop, or slot presence when the content is the consumer's              |
| `INSTANCE_SWAP`                               | a named slot                                                                     |
| `TEXT`                                        | a prop with a matching slot for the rich case                                    |
| `SLOT`                                        | a named slot                                                                     |
| Positional variant (`Type=First/Middle/Last`) | `:first-child` / `:last-child` in CSS, not a prop                                |

Splitting a Figma property is allowed when it reaches variants the board could
not express — `Slider`'s `Type` becomes `range` + `orientation`, which reaches
vertical-range. Document the split in `src/types.ts`.

Add every union to `src/types.ts` with a comment naming the Figma set. The
playground's props catalogue reads those unions to build its controls.

---

## 8. The verification loop

### 8.1 What the harness does and does not prove

`npm run verify:figma` reads the **built** stylesheet, resolves every `var()`
chain through the token layers, and compares against the traced spec.

- It proves **values**.
- It cannot prove **structure**. It tests whatever selectors the component
  defines — including invented ones.
- **A thin section is not a passing section, it is an unchecked one.** Four to
  six checks on a composite component is the tell. `rich-editor` had five checks,
  three of which named selectors that no longer existed.

Never read the SCSS to verify a colour. The token layer is four levels deep; a
wrong alias still compiles to valid CSS that renders the wrong colour.

### 8.2 The loop

```bash
npm run build           # verify:figma reads dist/, so build first
npm run verify:figma
npm test
npm run typecheck
npm run lint
npm run build:playground
```

### 8.3 Writing a harness section

One section per component. When you fix a component, **rewrite its section
against the real node** so the old shape cannot come back.

```js
section('thing', () => {
  const root = rule('.ev-thing')
  check('thing gap', resolve(root.get('gap')), '4px')

  const scope = merged('.ev-thing')
  checkVar('thing border', scope, '--ev-thing-border', '#c4cada')

  // Assert absences too - this is what catches an invented node.
  pass('thing draws no notch', rule('.ev-thing__label').size === 0, 'absent')
})
```

Helpers: `rule(sel)` exact match, `merged(...sels)` cascade, `resolve(value,
scope)` expands `var()`, `check(label, got, want)`, `checkVar(label, scope,
prop, want)`, `pass(label, condition, detail)`.

Comment any deliberate deviation in the section itself, with the reason — e.g.
the tooltip hugs to `max-width: 320px` rather than the board's `FIXED` 320,
because a fixed 320 overflows on `placement="left"`.

### 8.4 Tests lock the structure

The harness cannot check order or presence; a spec can:

```ts
const children = Array.from(wrapper.element.children).map(
  (el) => (el as Element).className.split(' ')[0],
)
expect(children).toEqual(['ev-thing__content', 'ev-thing__toolbar', 'ev-thing__message'])
```

Assert counts the board fixes (19 controls, 7 separators), and assert the
absence of nodes the board does not draw.

---

## 9. Component checklist

1. `src/components/<name>/Ev<Name>.vue`
2. `defineOptions({ name: 'Ev<Name>' })`
3. Non-scoped `<style lang="scss">`, `ev-<name>` BEM, semantic tokens only
4. Header comment with the node tree you ported, in board order
5. Unions in `src/types.ts`, each naming its Figma set
6. Re-export from `src/components/index.ts`
7. `Ev<Name>.spec.ts` — structure, order, counts, absences
8. A section in `scripts/verify-figma.mjs` that passes
9. A `playground/App.vue` section, and a `SIMULATOR_DEMOS` entry so the props
   simulator has something to show inside it

`npm run extract:props` regenerates `playground/component-props.ts`. It runs
automatically before `dev` and `build:playground`; never hand-edit it.

---

## 10. Rules of thumb

- **Read the node before you write the CSS.** Not the screenshot, not the doc.
- **Structure first, colour second.** Colour errors get caught; structure errors ship.
- **A pattern from a sibling component is a hypothesis, not evidence.** Confirm
  the node exists on _this_ set.
- **Odd values are usually real.** Radio's `#f1f1f4` border, Toggle Outline's
  grey active state, Direction's off-scale gap of 10, Popover's `#c4cada`
  description — all verified, none "cleaned up".
- **When the design is genuinely wrong for the web, deviate and say so** in the
  code comment and in the harness section. Silent deviation is the problem, not
  deviation.
- **State what you verified and how.** "875 values pass" means the built CSS
  matches the stored spec — it does not mean the spec matches Figma today.
