/**
 * Figma parity check.
 *
 * Resolves every `var()` chain in the built stylesheet and compares the result
 * to the values traced from the "EVOQ - Design System" Figma file. Run it after
 * `npm run build`:
 *
 *     npm run verify:figma
 *
 * Adding a component means adding a section here. A component is not done until
 * its section passes - see the note at the top of `figma-css.mjs` for why the
 * built CSS is the only thing worth checking.
 */

import fs from 'node:fs'
import process from 'node:process'
import { createReader, createReporter, readBuiltCss } from './figma-css.mjs'

const css = readBuiltCss()
const { resolve, rule, merged } = createReader(css)
const { passed, failed, check, pass } = createReporter()

const sections = []
function section(name, run) {
  const before = passed.length + failed.length
  run()
  sections.push({ name, count: passed.length + failed.length - before })
}

/** Check a value that flows through component-level custom properties. */
function checkVar(label, scope, prop, want) {
  check(label, resolve(scope.get(prop), scope), want)
}

// ---------------------------------------------------------------- Tokens
// 63 semantic tokens x 2 modes, against the scrape in design/.
section('tokens', () => {
  const fig = JSON.parse(fs.readFileSync('design/figma-introduction-tokens.json', 'utf8'))
  const rules = createReader(css)

  const light = rules.merged(':root', "[data-ev-theme='light']", '[data-ev-theme=light]')
  const dark = new Map(light)
  for (const [k, v] of rules.merged("[data-ev-theme='dark']", '[data-ev-theme=dark]')) {
    dark.set(k, v)
  }

  const toVar = (t) => '--ev-' + t.replace(/\//g, '-')
  for (const [group, rows] of Object.entries(fig.semantic)) {
    if (group === 'modes') continue
    for (const row of rows) {
      for (const mode of ['light', 'dark']) {
        const scope = mode === 'light' ? light : dark
        check(
          `token ${row.token} [${mode}]`,
          rules.resolve(scope.get(toVar(row.token)), scope),
          row[mode],
        )
      }
    }
  }
})

// ---------------------------------------------------------------- Button
// `Button` set: 7 Variant x 4 State x 2 Size x Icon Only (112 variants).
section('button', () => {
  const V = '.ev-button--'
  const spec = {
    primary: { rest: { bg: '#1b84ff', color: '#ffffff' }, hover: '#166acc', active: '#166acc' },
    'secondary-light': {
      rest: { bg: '#e8f3ff', border: '#a4ceff', color: '#1b84ff' },
      hover: '#1b84ff',
      active: '#166acc',
    },
    'secondary-grey': {
      rest: { bg: '#f1f1f4', border: '#dbdfe9', color: '#071437' },
      hover: '#d7dbe3',
      active: '#c4c8d5',
    },
    'secondary-white': {
      rest: { bg: '#ffffff', color: '#071437' },
      hover: '#d7dbe3',
      active: '#c4c8d5',
    },
    destructive: { rest: { bg: '#f82a5b', color: '#ffffff' }, hover: '#c62249', active: '#f82a5b' },
    outline: {
      rest: { bg: 'transparent', border: '#dbdfe9', color: '#071437' },
      hover: '#d7dbe3',
      active: '#d7dbe3',
      disabledBg: '#f9f9f9',
    },
    ghost: {
      rest: { bg: 'transparent', color: '#071437' },
      hover: '#d7dbe3',
      active: '#d7dbe3',
      disabledBg: '#f9f9f9',
    },
  }

  for (const [name, s] of Object.entries(spec)) {
    const rest = rule(`${V}${name}`)
    check(`button ${name} rest bg`, resolve(rest.get('background-color')), s.rest.bg)
    check(`button ${name} rest color`, resolve(rest.get('color')), s.rest.color)
    if (s.rest.border) {
      check(`button ${name} rest border`, resolve(rest.get('border-color')), s.rest.border)
    }

    const hov = rule(`${V}${name}:hover:not(:disabled)`)
    check(`button ${name} hover bg`, resolve(hov.get('background-color')), s.hover)

    const act = rule(`${V}${name}:active:not(:disabled)`)
    check(`button ${name} active bg`, resolve(act.get('background-color')), s.active)
    const shadow = resolve(act.get('box-shadow'))
    check(
      `button ${name} active inset shadow`,
      shadow && /inset 0 4px 4px/.test(shadow) ? 'inset' : String(shadow),
      'inset',
    )

    if (s.disabledBg) {
      check(
        `button ${name} disabled bg`,
        resolve(rule(`${V}${name}:disabled`).get('background-color')),
        s.disabledBg,
      )
    }
  }

  const base = rule('.ev-button')
  check('button radius', resolve(base.get('border-radius')), '6px')
  check('button font-size', resolve(base.get('font-size')), '0.875rem')
  check('button line-height', resolve(base.get('line-height')), '1rem')
  check('button font-weight', resolve(base.get('font-weight')), '500')
  check('button disabled opacity', rule('.ev-button:disabled').get('opacity'), '0.5')

  const def = rule(`${V}default`)
  check('button default height', def.get('min-height'), '40px')
  check('button default pad-y', resolve(def.get('padding').split(' ')[0]), '12px')
  check('button default pad-x', resolve(def.get('padding').split(' ')[1]), '16px')
  check('button default gap', resolve(def.get('gap')), '4px')

  const sm = rule(`${V}small`)
  check('button small height', sm.get('min-height'), '32px')
  check('button small pad', resolve(sm.get('padding')), '8px')
  check('button small gap', resolve(sm.get('gap')), '2px')

  check('button icon-only default w', rule(`${V}icon-only.ev-button--default`).get('width'), '40px')
  check('button icon-only small w', rule(`${V}icon-only.ev-button--small`).get('width'), '32px')
})

// ------------------------------------------------------------- Separator
section('separator', () => {
  const base = rule('.ev-separator')
  check('separator colour', resolve(base.get('background-color')), '#dbdfe9')
  check('separator h thickness', resolve(rule('.ev-separator--horizontal').get('height')), '1px')
  check('separator v thickness', resolve(rule('.ev-separator--vertical').get('width')), '1px')
  // `Solid Line - Full` spans its container on the long axis.
  check('separator h span', rule('.ev-separator--horizontal').get('width'), '100%')
  check('separator v span', rule('.ev-separator--vertical').get('height'), '100%')
  pass('separator has no radius', !base.get('border-radius'), 'square, as the board draws it')
  pass('separator has no padding', !base.get('padding'), 'none')
})

// ------------------------------------------------------------------- Kbd
section('kbd', () => {
  const base = rule('.ev-kbd')
  check('kbd height', base.get('height'), '16px')
  check('kbd radius', resolve(base.get('border-radius')), '6px')
  check('kbd font-size', resolve(base.get('font-size')), '0.625rem')
  check('kbd line-height', resolve(base.get('line-height')), '1rem')
  check('kbd font-weight', resolve(base.get('font-weight')), '700')
  check('kbd text pad', resolve(rule('.ev-kbd--text').get('padding')), '0 2px')
  check('kbd icon pad', resolve(rule('.ev-kbd--icon').get('padding')), '2px')
  check('kbd icon width', rule('.ev-kbd--icon').get('width'), '16px')

  const lightText = merged('.ev-kbd')
  checkVar('kbd light text bg', lightText, '--ev-kbd-bg', '#ebedf1')
  checkVar('kbd light text fg', lightText, '--ev-kbd-fg', '#78829d')
  checkVar('kbd light icon fg', merged('.ev-kbd', '.ev-kbd--icon'), '--ev-kbd-fg', '#99a1b7')

  const darkText = merged('.ev-kbd', '.ev-kbd--dark')
  checkVar('kbd dark text bg', darkText, '--ev-kbd-bg', '#5e626f')
  checkVar('kbd dark text fg', darkText, '--ev-kbd-fg', '#c4cada')
  checkVar(
    'kbd dark icon fg',
    merged('.ev-kbd', '.ev-kbd--icon', '.ev-kbd--dark', '.ev-kbd--dark.ev-kbd--icon'),
    '--ev-kbd-fg',
    '#c4cada',
  )
})

// ----------------------------------------------------------------- Badge
section('badge', () => {
  const base = rule('.ev-badge')
  check('badge min-height', base.get('min-height'), '24px')
  check('badge radius', resolve(base.get('border-radius')), '4px')
  check('badge padding', resolve(base.get('padding')), '4px 8px')
  check('badge gap', resolve(base.get('gap')), '4px')
  check('badge font-size', resolve(base.get('font-size')), '0.75rem')
  check('badge font-weight', resolve(base.get('font-weight')), '500')

  // variant -> [bg, border, label, icon]
  const tinted = {
    success: ['#d1f4dd', '#a2e8ba', '#129e42', '#129e42'],
    waiting: ['#fef3d7', '#fde7b0', '#c79c2e', '#c79c2e'],
    neutral: ['#f1f1f4', '#dbdfe9', '#78829d', '#78829d'],
    draft: ['#e8f3ff', '#a4ceff', '#1b84ff', '#166acc'],
    reject: ['#fed4de', '#fcaabd', '#c62249', '#c62249'],
    custom: ['#f9ede8', 'transparent', '#9e3b12', '#9e3b12'],
  }
  const reversed = {
    success: ['#17c653', 'transparent', '#ffffff', '#ffffff'],
    waiting: ['#f9c339', 'transparent', '#ffffff', '#ffffff'],
    neutral: ['#f1f1f4', 'transparent', '#071437', '#78829d'],
    draft: ['#1b84ff', 'transparent', '#ffffff', '#ffffff'],
    reject: ['#f82a5b', 'transparent', '#ffffff', '#ffffff'],
    custom: ['#c54a16', 'transparent', '#ffffff', '#ffffff'],
  }

  for (const [name, [bg, border, fg, icon]] of Object.entries(tinted)) {
    const scope = merged('.ev-badge', `.ev-badge--${name}`)
    checkVar(`badge ${name} bg`, scope, '--ev-badge-bg', bg)
    checkVar(`badge ${name} border`, scope, '--ev-badge-border', border)
    checkVar(`badge ${name} label`, scope, '--ev-badge-fg', fg)
    checkVar(`badge ${name} icon`, scope, '--ev-badge-icon', icon)
  }

  for (const [name, [bg, border, fg, icon]] of Object.entries(reversed)) {
    const scope = merged(
      '.ev-badge',
      `.ev-badge--${name}`,
      '.ev-badge--reverse',
      `.ev-badge--reverse.ev-badge--${name}`,
    )
    checkVar(`badge ${name} reverse bg`, scope, '--ev-badge-bg', bg)
    checkVar(`badge ${name} reverse border`, scope, '--ev-badge-border', border)
    checkVar(`badge ${name} reverse label`, scope, '--ev-badge-fg', fg)
    checkVar(`badge ${name} reverse icon`, scope, '--ev-badge-icon', icon)
  }
})

// ------------------------------------------------------------------- Tag
section('tag', () => {
  const base = rule('.ev-tag')
  check('tag min-height', base.get('min-height'), '24px')
  check('tag radius', resolve(base.get('border-radius')), '8px')
  check('tag padding', resolve(base.get('padding')), '4px')
  check('tag gap', resolve(base.get('gap')), '4px')
  check('tag label colour', resolve(base.get('color')), '#071437')
  check('tag font-size', resolve(base.get('font-size')), '0.75rem')

  const def = merged('.ev-tag')
  checkVar('tag default bg', def, '--ev-tag-bg', '#d7dbe3')
  checkVar('tag default hover', def, '--ev-tag-bg-hover', '#c4c8d5')
  checkVar('tag default border', def, '--ev-tag-border', 'transparent')

  const out = merged('.ev-tag', '.ev-tag--outline')
  checkVar('tag outline bg', out, '--ev-tag-bg', 'transparent')
  checkVar('tag outline hover', out, '--ev-tag-bg-hover', '#ebedf1')
  checkVar('tag outline border', out, '--ev-tag-border', '#dbdfe9')

  check('tag remove icon colour', resolve(rule('.ev-tag__remove').get('color')), '#78829d')

  /*
   * `TagGroup` - HORIZONTAL, no padding. Spacing sets itemSpacing (and the row
   * gap when wrapping); Type switches NO_WRAP + clip for WRAP.
   */
  const group = rule('.ev-tag-group')
  check('tag group padding', group.get('padding'), '0')
  check('tag group direction', group.get('flex-direction'), 'row')
  check(
    'tag group spacing default',
    resolve(rule('.ev-tag-group--spacing-default').get('gap')),
    '4px',
  )
  check('tag group spacing loose', resolve(rule('.ev-tag-group--spacing-loose').get('gap')), '8px')
  check('tag group wrap', rule('.ev-tag-group--type-wrap').get('flex-wrap'), 'wrap')
  check('tag group scroll no-wrap', rule('.ev-tag-group--type-scroll').get('flex-wrap'), 'nowrap')
  check('tag group scroll clips', rule('.ev-tag-group--type-scroll').get('overflow-x'), 'auto')
})

// ---------------------------------------------------------- Aspect ratio
section('aspect-ratio', () => {
  const base = rule('.ev-aspect-ratio')
  check('aspect radius', resolve(base.get('border-radius')), '12px')
  check('aspect bg', resolve(base.get('background-color')), '#f9f9f9')
  // The node is a bare frame holding one `Slot` that fills it edge to edge.
  pass('aspect has no padding', !base.get('padding'), 'none, the Slot fills it')
  check('aspect clips the slot', base.get('overflow'), 'hidden')
  const media = rule('.ev-aspect-ratio>img')
  check('aspect media fit', media.get('object-fit'), 'cover')
  check('aspect media width', media.get('width'), '100%')
  check('aspect media height', media.get('height'), '100%')
})

// ------------------------------------------------------------------ Hint
section('hint', () => {
  const base = rule('.ev-hint')
  check('hint bg', resolve(base.get('background-color')), '#f82a5b')
  check('hint fg', resolve(base.get('color')), '#ffffff')
  check('hint radius', resolve(base.get('border-radius')), '9999px')
  check('hint line-height', resolve(base.get('line-height')), '1rem')
  check('hint font-weight', resolve(base.get('font-weight')), '500')

  for (const [size, px] of Object.entries({ large: '16px', medium: '10px', small: '8px' })) {
    const r = rule(`.ev-hint--dot.ev-hint--${size}`)
    check(`hint dot ${size} w`, r.get('width'), px)
    check(`hint dot ${size} h`, r.get('height'), px)
  }

  const count = {
    large: ['24px', '0.875rem'],
    medium: ['16px', '0.875rem'],
    small: ['16px', '0.625rem'],
  }
  for (const [size, [px, fs]] of Object.entries(count)) {
    const r = rule(`.ev-hint--count.ev-hint--${size}`)
    check(`hint count ${size} h`, r.get('height'), px)
    check(`hint count ${size} min-w`, r.get('min-width'), px)
    check(`hint count ${size} font`, resolve(r.get('font-size')), fs)
  }
  check('hint count pad', resolve(rule('.ev-hint--count').get('padding')), '0 4px')
  check('hint wide pad', resolve(rule('.ev-hint--large.ev-hint--wide').get('padding')), '0 8px')
})

// -------------------------------------------------------------- Checkbox
section('checkbox', () => {
  const base = rule('.ev-checkbox')
  check('checkbox row pad', resolve(base.get('padding')), '4px')
  check('checkbox row gap', resolve(base.get('gap')), '8px')

  const box = rule('.ev-checkbox__box')
  check('checkbox box size', box.get('width'), '16px')
  check('checkbox box radius', resolve(box.get('border-radius')), '4px')
  check('checkbox label font', resolve(rule('.ev-checkbox__label').get('font-size')), '0.875rem')
  check('checkbox text gap', resolve(rule('.ev-checkbox__text').get('gap')), '4px')

  const unchecked = merged('.ev-checkbox')
  checkVar('checkbox uncheck box bg', unchecked, '--ev-checkbox-box-bg', '#ffffff')
  checkVar('checkbox uncheck box border', unchecked, '--ev-checkbox-box-border', '#dbdfe9')
  checkVar('checkbox uncheck label', unchecked, '--ev-checkbox-label', '#071437')
  checkVar('checkbox uncheck subtext', unchecked, '--ev-checkbox-subtext', '#78829d')

  for (const state of ['checked', 'indeterminate']) {
    const scope = merged('.ev-checkbox', `.ev-checkbox--${state}`)
    checkVar(`checkbox ${state} box bg`, scope, '--ev-checkbox-box-bg', '#1b84ff')
    checkVar(`checkbox ${state} mark`, scope, '--ev-checkbox-mark', '#ffffff')
  }

  const err = merged('.ev-checkbox', '.ev-checkbox--error')
  checkVar('checkbox error box bg', err, '--ev-checkbox-box-bg', '#ffffff')
  checkVar('checkbox error box border', err, '--ev-checkbox-box-border', '#f82a5b')
  checkVar('checkbox error label', err, '--ev-checkbox-label', '#071437')
  checkVar('checkbox error subtext', err, '--ev-checkbox-subtext', '#c62249')

  const dis = merged('.ev-checkbox', '.ev-checkbox--disabled')
  checkVar('checkbox disabled box bg', dis, '--ev-checkbox-box-bg', '#f9f9f9')
  checkVar('checkbox disabled box border', dis, '--ev-checkbox-box-border', '#dbdfe9')
  checkVar('checkbox disabled mark', dis, '--ev-checkbox-mark', '#dbdfe9')
  checkVar('checkbox disabled label', dis, '--ev-checkbox-label', '#dbdfe9')
})

// ----------------------------------------------------------------- Radio
section('radio', () => {
  const base = rule('.ev-radio')
  check('radio row pad', resolve(base.get('padding')), '4px')
  check('radio row gap', resolve(base.get('gap')), '8px')

  const dot = rule('.ev-radio__dot')
  check('radio dot size', dot.get('width'), '16px')
  check('radio dot radius', resolve(dot.get('border-radius')), '9999px')
  check('radio indicator size', rule('.ev-radio__indicator').get('width'), '8px')

  const def = merged('.ev-radio')
  checkVar('radio default bg', def, '--ev-radio-bg', '#ffffff')
  checkVar('radio default border', def, '--ev-radio-border', '#f1f1f4')
  checkVar('radio default label', def, '--ev-radio-label', '#071437')
  checkVar('radio default subtext', def, '--ev-radio-subtext', '#78829d')

  const act = merged('.ev-radio', '.ev-radio--checked')
  checkVar('radio active bg', act, '--ev-radio-bg', '#1b84ff')
  checkVar('radio active border', act, '--ev-radio-border', '#1b84ff')
  checkVar('radio active dot', act, '--ev-radio-dot', '#ffffff')

  const err = merged('.ev-radio', '.ev-radio--error')
  checkVar('radio error border', err, '--ev-radio-border', '#f82a5b')
  checkVar('radio error subtext', err, '--ev-radio-subtext', '#c62249')

  const dis = merged('.ev-radio', '.ev-radio--disabled')
  checkVar('radio disabled bg', dis, '--ev-radio-bg', '#ebedf1')
  checkVar('radio disabled border', dis, '--ev-radio-border', '#dbdfe9')
  checkVar('radio disabled label', dis, '--ev-radio-label', '#dbdfe9')

  const disAct = merged(
    '.ev-radio',
    '.ev-radio--checked',
    '.ev-radio--disabled',
    '.ev-radio--disabled.ev-radio--checked',
  )
  checkVar('radio disabled-active bg', disAct, '--ev-radio-bg', '#1b84ff')
  check(
    'radio disabled-active opacity',
    rule('.ev-radio--disabled.ev-radio--checked').get('opacity'),
    '0.5',
  )
})

// ---------------------------------------------------------------- Switch
section('switch', () => {
  check('switch track radius', resolve(rule('.ev-switch__track').get('border-radius')), '9999px')
  check(
    'switch thumb colour',
    resolve(rule('.ev-switch__thumb').get('background-color')),
    '#ffffff',
  )
  check('switch wrapper pad', resolve(rule('.ev-switch').get('padding')), '2px 0')
  check('switch text colour', resolve(rule('.ev-switch__text').get('color')), '#ffffff')

  const dTrack = rule('.ev-switch--default .ev-switch__track')
  check('switch default track w', dTrack.get('width'), '40px')
  check('switch default track h', dTrack.get('height'), '20px')
  check('switch default track pad', resolve(dTrack.get('padding')), '4px')
  check('switch default thumb', rule('.ev-switch--default .ev-switch__thumb').get('width'), '12px')
  check(
    'switch default text font',
    resolve(rule('.ev-switch--default .ev-switch__text').get('font-size')),
    '0.625rem',
  )

  const sTrack = rule('.ev-switch--small .ev-switch__track')
  check('switch small track w', sTrack.get('width'), '24px')
  check('switch small track h', sTrack.get('height'), '12px')
  check('switch small track pad', resolve(sTrack.get('padding')), '2px')
  check('switch small thumb', rule('.ev-switch--small .ev-switch__thumb').get('width'), '8px')
  check(
    'switch small text font',
    resolve(rule('.ev-switch--small .ev-switch__text').get('font-size')),
    '0.5rem',
  )

  // The labelled track is wider, and its asymmetric padding flips when on.
  const wt = '.ev-switch--with-text'
  check(
    'switch default+text track w',
    rule(`${wt}.ev-switch--default .ev-switch__track`).get('width'),
    '54px',
  )
  check(
    'switch small+text track w',
    rule(`${wt}.ev-switch--small .ev-switch__track`).get('width'),
    '39px',
  )
  check(
    'switch default+text pad off',
    resolve(rule(`${wt}.ev-switch--default .ev-switch__track`).get('padding')),
    '2px 8px 2px 4px',
  )
  check(
    'switch default+text pad on',
    resolve(rule(`${wt}.ev-switch--on.ev-switch--default .ev-switch__track`).get('padding')),
    '2px 4px 2px 8px',
  )
  check(
    'switch small+text pad off',
    resolve(rule(`${wt}.ev-switch--small .ev-switch__track`).get('padding')),
    '0 4px 0 2px',
  )
  check(
    'switch small+text pad on',
    resolve(rule(`${wt}.ev-switch--on.ev-switch--small .ev-switch__track`).get('padding')),
    '0 2px 0 4px',
  )
  check(
    'switch on+text flips row',
    rule(`${wt}.ev-switch--on .ev-switch__track`).get('flex-direction'),
    'row-reverse',
  )

  // Precedence: disabled outranks error, error outranks on/off.
  checkVar('switch off track', merged('.ev-switch'), '--ev-switch-track', '#f1f1f4')
  checkVar(
    'switch on track',
    merged('.ev-switch', '.ev-switch--on'),
    '--ev-switch-track',
    '#1b84ff',
  )
  checkVar(
    'switch error track',
    merged('.ev-switch', '.ev-switch--on', '.ev-switch--error'),
    '--ev-switch-track',
    '#f82a5b',
  )
  checkVar(
    'switch disabled track',
    merged('.ev-switch', '.ev-switch--on', '.ev-switch--error', '.ev-switch--disabled'),
    '--ev-switch-track',
    '#c4c8d5',
  )

  /*
   * The `SwitchField` layer - the board's H g8 row of Text / .Switch / Text,
   * each Text block VERTICAL g4, padded 4,0,4,0 at Default and 0 at Small.
   */
  const field = rule('.ev-switch-wrapper')
  check('switch field gap', resolve(field.get('gap')), '8px')
  check('switch field align', field.get('align-items'), 'flex-start')
  check(
    'switch field pad default',
    resolve(rule('.ev-switch-wrapper--default').get('padding')),
    '4px 0',
  )
  check('switch field pad small', resolve(rule('.ev-switch-wrapper--small').get('padding')), '0')
  check(
    'switch field left places the text first',
    rule('.ev-switch-wrapper--label-left').get('flex-direction'),
    'row-reverse',
  )
  check('switch text gap', resolve(rule('.ev-switch-wrapper__text').get('gap')), '4px')

  const fScope = merged('.ev-switch-wrapper')
  checkVar('switch label colour', fScope, '--ev-switch-label', '#071437')
  checkVar('switch subtext colour', fScope, '--ev-switch-subtext', '#78829d')
  check(
    'switch label font',
    resolve(rule('.ev-switch-wrapper__label').get('font-size')),
    '0.875rem',
  )
  // The board sets Subtext at 14px too - it does not step down to 12.
  check(
    'switch subtext font',
    resolve(rule('.ev-switch-wrapper__subtext').get('font-size')),
    '0.875rem',
  )
  checkVar(
    'switch error subtext',
    merged('.ev-switch-wrapper', '.ev-switch-wrapper--error'),
    '--ev-switch-subtext',
    '#c62249',
  )
  // The board does NOT dim the text in the Disable states - only the track.
  const fDis = merged('.ev-switch-wrapper', '.ev-switch-wrapper--disabled')
  checkVar('switch disabled label stays', fDis, '--ev-switch-label', '#071437')
  checkVar('switch disabled subtext stays', fDis, '--ev-switch-subtext', '#78829d')
})

// ---------------------------------------------------------------- Toggle
section('toggle', () => {
  const base = rule('.ev-toggle')
  check('toggle radius', resolve(base.get('border-radius')), '8px')
  check('toggle gap', resolve(base.get('gap')), '2px')

  const d = rule('.ev-toggle--size-default')
  check('toggle default h', d.get('min-height'), '32px')
  check('toggle default pad', resolve(d.get('padding')), '8px')
  check('toggle default font', resolve(d.get('font-size')), '0.875rem')

  const s = rule('.ev-toggle--size-small')
  check('toggle small h', s.get('min-height'), '24px')
  check('toggle small pad', resolve(s.get('padding')), '4px')
  check('toggle small font', resolve(s.get('font-size')), '0.75rem')

  const def = merged('.ev-toggle')
  checkVar('toggle default bg', def, '--ev-toggle-bg', '#ebedf1')
  checkVar('toggle default fg', def, '--ev-toggle-fg', '#071437')
  checkVar('toggle default icon', def, '--ev-toggle-icon', '#78829d')

  const defAct = merged('.ev-toggle', '.ev-toggle--active')
  checkVar('toggle default active bg', defAct, '--ev-toggle-bg', '#1b84ff')
  checkVar('toggle default active fg', defAct, '--ev-toggle-fg', '#ffffff')

  const out = merged('.ev-toggle', '.ev-toggle--outline')
  checkVar('toggle outline bg', out, '--ev-toggle-bg', 'transparent')
  checkVar('toggle outline border', out, '--ev-toggle-border', '#dbdfe9')
  checkVar('toggle outline fg', out, '--ev-toggle-fg', '#78829d')
  checkVar('toggle outline icon', out, '--ev-toggle-icon', '#99a1b7')

  const outAct = merged(
    '.ev-toggle',
    '.ev-toggle--outline',
    '.ev-toggle--active',
    '.ev-toggle--active.ev-toggle--outline',
  )
  checkVar('toggle outline active bg', outAct, '--ev-toggle-bg', '#d7dbe3')
  checkVar('toggle outline active fg', outAct, '--ev-toggle-fg', '#78829d')

  // The one place disabled changes a colour rather than just dimming it.
  const outDisAct = merged(
    '.ev-toggle',
    '.ev-toggle--outline',
    '.ev-toggle--active',
    '.ev-toggle--active.ev-toggle--outline',
    '.ev-toggle--disabled',
    '.ev-toggle--disabled.ev-toggle--outline.ev-toggle--active',
  )
  checkVar('toggle outline disabled-active bg', outDisAct, '--ev-toggle-bg', '#ebedf1')
  check('toggle disabled opacity', rule('.ev-toggle--disabled').get('opacity'), '0.5')

  check(
    'toggle group default gap',
    resolve(rule('.ev-toggle-group--size-default').get('gap')),
    '8px',
  )
  check('toggle group small gap', resolve(rule('.ev-toggle-group--size-small').get('gap')), '4px')
})

// ------------------------------------------------------------ ButtonLink
section('button-link', () => {
  const base = rule('.ev-button-link')
  check('link gap', resolve(base.get('gap')), '4px')
  check('link font-size', resolve(base.get('font-size')), '0.875rem')
  check('link line-height', resolve(base.get('line-height')), '1rem')
  check('link font-weight', resolve(base.get('font-weight')), '500')
  check(
    'link hover weight',
    resolve(rule('.ev-button-link:hover:not(:disabled)').get('font-weight')),
    '700',
  )

  // variant -> [rest fg, rest icon, hover fg (null = unchanged), active fg, active icon]
  const variants = {
    primary: ['#1b84ff', '#1b84ff', '#166acc', '#78829d', '#99a1b7'],
    secondary: ['#78829d', '#99a1b7', null, '#071437', '#78829d'],
    tertiary: ['#071437', '#78829d', null, '#78829d', '#99a1b7'],
    invert: ['#ffffff', '#ffffff', null, '#c4cada', '#c4cada'],
    custom: ['#c54a16', '#1b84ff', '#9e3b12', '#78829d', '#99a1b7'],
  }
  for (const [name, [fg, icon, hoverFg, activeFg, activeIcon]] of Object.entries(variants)) {
    const rest = merged('.ev-button-link', `.ev-button-link--${name}`)
    checkVar(`link ${name} fg`, rest, '--ev-link-fg', fg)
    checkVar(`link ${name} icon`, rest, '--ev-link-icon', icon)

    if (hoverFg) {
      const hov = merged(
        '.ev-button-link',
        `.ev-button-link--${name}`,
        `.ev-button-link--${name}:hover:not(:disabled)`,
      )
      checkVar(`link ${name} hover fg`, hov, '--ev-link-fg', hoverFg)
    }

    const act = merged(
      '.ev-button-link',
      `.ev-button-link--${name}`,
      `.ev-button-link--${name}:active:not(:disabled)`,
    )
    checkVar(`link ${name} active fg`, act, '--ev-link-fg', activeFg)
    checkVar(`link ${name} active icon`, act, '--ev-link-icon', activeIcon)
  }
})

// ------------------------------------------------------------------ Card
section('card', () => {
  const base = rule('.ev-card')
  check('card radius', resolve(base.get('border-radius')), '16px')
  check('card bg', resolve(base.get('background-color')), '#ffffff')
  check('card border', resolve(base.get('border')), '1px solid #dbdfe9')

  const body = rule('.ev-card__body')
  check('card body pad', resolve(body.get('padding'), merged('.ev-card')), '16px')
  check('card body gap', resolve(body.get('gap'), merged('.ev-card')), '16px')
  check('card header gap', resolve(rule('.ev-card__header').get('gap')), '4px')
  check('card title colour', resolve(rule('.ev-card__title').get('color')), '#071437')
  check('card description colour', resolve(rule('.ev-card__description').get('color')), '#78829d')
  // Default and Image draw the title at 16px Bold / 20px line; only Small is 14px Medium.
  check('card title font', resolve(rule('.ev-card__title').get('font-size')), '1rem')
  check('card title weight', resolve(rule('.ev-card__title').get('font-weight')), '700')
  check('card title line-height', resolve(rule('.ev-card__title').get('line-height')), '1.25rem')
  check('card footer gap', resolve(rule('.ev-card__footer').get('gap')), '8px')

  const small = merged('.ev-card', '.ev-card--small')
  check('card small radius', resolve(rule('.ev-card--small').get('border-radius')), '8px')
  check('card small pad', resolve(rule('.ev-card__body').get('padding'), small), '12px')
  check('card small gap', resolve(rule('.ev-card__body').get('gap'), small), '12px')
  check(
    'card small header gap',
    resolve(rule('.ev-card--small .ev-card__header').get('gap')),
    '2px',
  )
  check(
    'card small title font',
    resolve(rule('.ev-card--small .ev-card__title').get('font-size')),
    '0.875rem',
  )
  check(
    'card small title weight',
    resolve(rule('.ev-card--small .ev-card__title').get('font-weight')),
    '500',
  )
  check(
    'card small description font',
    resolve(rule('.ev-card--small .ev-card__description').get('font-size')),
    '0.75rem',
  )

  // The media runs edge to edge, so only the body below it keeps the padding.
  check(
    'card image body pad',
    resolve(rule('.ev-card--image .ev-card__body').get('padding'), merged('.ev-card')),
    '0 16px 16px',
  )
})

// ------------------------------------------------------------ Breadcrumb
section('breadcrumb', () => {
  check('breadcrumb gap', resolve(rule('.ev-breadcrumb__list').get('gap')), '4px')
  check('breadcrumb link colour', resolve(rule('.ev-breadcrumb__link').get('color')), '#78829d')
  check('breadcrumb link font', resolve(rule('.ev-breadcrumb__link').get('font-size')), '0.875rem')
  check(
    'breadcrumb current colour',
    resolve(rule('.ev-breadcrumb__link--current').get('color')),
    '#071437',
  )
  check(
    'breadcrumb separator colour',
    resolve(rule('.ev-breadcrumb__separator').get('color')),
    '#99a1b7',
  )
  check('breadcrumb icon colour', resolve(rule('.ev-breadcrumb__icon').get('color')), '#99a1b7')
})

// ------------------------------------------------------------- Accordion
section('accordion', () => {
  const base = rule('.ev-accordion')
  check('accordion gap', resolve(base.get('gap')), '8px')
  check('accordion header gap', resolve(rule('.ev-accordion__header').get('gap')), '8px')
  check('accordion text gap', resolve(rule('.ev-accordion__text').get('gap')), '4px')
  check('accordion chevron size', rule('.ev-accordion__chevron').get('width'), '20px')
  check(
    'accordion rule colour',
    resolve(rule('.ev-accordion__rule').get('background-color')),
    '#dbdfe9',
  )

  const def = merged('.ev-accordion')
  checkVar('accordion title', def, '--ev-accordion-title', '#071437')
  checkVar('accordion subtext', def, '--ev-accordion-subtext', '#78829d')
  checkVar('accordion chevron', def, '--ev-accordion-chevron', '#99a1b7')
  check('accordion title font', resolve(rule('.ev-accordion__title').get('font-size')), '0.875rem')
  check(
    'accordion subtext font',
    resolve(rule('.ev-accordion__subtext').get('font-size')),
    '0.75rem',
  )

  const dis = merged('.ev-accordion', '.ev-accordion--disabled')
  checkVar('accordion disabled title', dis, '--ev-accordion-title', '#dbdfe9')
  checkVar('accordion disabled subtext', dis, '--ev-accordion-subtext', '#dbdfe9')
  checkVar('accordion disabled chevron', dis, '--ev-accordion-chevron', '#dbdfe9')

  const card = rule('.ev-accordion--card')
  check('accordion card radius', resolve(card.get('border-radius')), '8px')
  check('accordion card bg', resolve(card.get('background-color')), '#ffffff')
  check(
    'accordion card header pad',
    resolve(rule('.ev-accordion--card .ev-accordion__header').get('padding')),
    '12px 16px',
  )
  check(
    'accordion card title font',
    resolve(rule('.ev-accordion--card .ev-accordion__title').get('font-size')),
    '1rem',
  )
  check(
    'accordion card title weight',
    resolve(rule('.ev-accordion--card .ev-accordion__title').get('font-weight')),
    '700',
  )
  check(
    'accordion card open header pad',
    resolve(
      rule('.ev-accordion--card.ev-accordion--expanded .ev-accordion__header').get('padding'),
    ),
    '16px 16px 4px',
  )
  check(
    'accordion card open panel pad',
    resolve(rule('.ev-accordion--card.ev-accordion--expanded .ev-accordion__panel').get('padding')),
    '12px 16px 16px',
  )
})

// ----------------------------------------------------------------- Alert
section('alert', () => {
  const base = rule('.ev-alert')
  check('alert gap', resolve(base.get('gap')), '8px')
  check('alert stacked pad', resolve(rule('.ev-alert--stacked').get('padding')), '8px')
  check('alert inline pad', resolve(rule('.ev-alert--inline').get('padding')), '8px 12px')
  check('alert stacked icon', rule('.ev-alert--stacked .ev-alert__icon').get('width'), '32px')
  check('alert inline icon', rule('.ev-alert--inline .ev-alert__icon').get('width'), '16px')
  check(
    'alert stacked title weight',
    resolve(rule('.ev-alert--stacked .ev-alert__title').get('font-weight')),
    '700',
  )
  check(
    'alert inline title weight',
    resolve(rule('.ev-alert--inline .ev-alert__title').get('font-weight')),
    '500',
  )
  check('alert subtext font', resolve(rule('.ev-alert__subtext').get('font-size')), '0.75rem')

  // variant -> [bg, border, icon, title, subtext, radius]
  const variants = {
    neutral: ['#f9f9f9', '#dbdfe9', '#78829d', '#071437', '#071437', '8px'],
    'neutral-dark': ['#3e424a', 'transparent', '#ffffff', '#ffffff', '#ffffff', '8px'],
    info: ['#d1e6ff', '#166acc', '#1b84ff', '#071437', '#78829d', '6px'],
    success: ['#d1f4dd', '#129e42', '#17c653', '#129e42', '#071437', '6px'],
    error: ['#fed4de', '#c62249', '#f82a5b', '#c62249', '#071437', '6px'],
    warning: ['#fef3d7', '#c79c2e', '#f9c339', '#c79c2e', '#071437', '6px'],
  }
  for (const [name, [bg, border, icon, title, subtext, radius]] of Object.entries(variants)) {
    const scope = merged('.ev-alert', `.ev-alert--${name}`)
    checkVar(`alert ${name} bg`, scope, '--ev-alert-bg', bg)
    checkVar(`alert ${name} border`, scope, '--ev-alert-border', border)
    checkVar(`alert ${name} icon`, scope, '--ev-alert-icon', icon)
    checkVar(`alert ${name} title`, scope, '--ev-alert-title', title)
    checkVar(`alert ${name} subtext`, scope, '--ev-alert-subtext', subtext)
    checkVar(`alert ${name} radius`, scope, '--ev-alert-radius', radius)
  }

  const inverse = { info: '#1b84ff', success: '#17c653', error: '#f82a5b', warning: '#f9c339' }
  for (const [name, bg] of Object.entries(inverse)) {
    const scope = merged(
      '.ev-alert',
      `.ev-alert--${name}`,
      '.ev-alert--inverse',
      `.ev-alert--inverse.ev-alert--${name}`,
    )
    checkVar(`alert ${name} inverse bg`, scope, '--ev-alert-bg', bg)
    checkVar(`alert ${name} inverse title`, scope, '--ev-alert-title', '#ffffff')
    checkVar(`alert ${name} inverse icon`, scope, '--ev-alert-icon', '#ffffff')
    checkVar(`alert ${name} inverse border`, scope, '--ev-alert-border', 'transparent')
  }
})

// ------------------------------------------------------------------ Tabs
section('tabs', () => {
  const seg = rule('.ev-tabs--segmented')
  check('tabs segmented gap', resolve(seg.get('gap')), '4px')
  check('tabs segmented pad', resolve(seg.get('padding')), '4px')
  check('tabs segmented radius', resolve(seg.get('border-radius')), '8px')
  check('tabs segmented bg', resolve(seg.get('background-color')), '#f9f9f9')
  check('tabs segmented border', resolve(seg.get('border')), '1px solid #c4cada')
  check('tabs line gap', resolve(rule('.ev-tabs--line').get('gap')), '12px')

  const item = rule('.ev-tab')
  check('tab height', item.get('min-height'), '32px')
  check('tab gap', resolve(item.get('gap')), '4px')
  check('tab font', resolve(item.get('font-size')), '0.875rem')

  const rest = merged('.ev-tab')
  checkVar('tab rest fg', rest, '--ev-tab-fg', '#78829d')
  checkVar('tab rest icon', rest, '--ev-tab-icon', '#99a1b7')
  checkVar('tab rest bg', rest, '--ev-tab-bg', 'transparent')

  const segItem = rule('.ev-tab--segmented')
  check('tab segmented pad', resolve(segItem.get('padding')), '8px 12px')
  check('tab segmented radius', resolve(segItem.get('border-radius')), '8px')

  const segActive = merged('.ev-tab', '.ev-tab--segmented', '.ev-tab--segmented.ev-tab--selected')
  checkVar('tab segmented active bg', segActive, '--ev-tab-bg', '#1b84ff')
  checkVar('tab segmented active fg', segActive, '--ev-tab-fg', '#ffffff')
  checkVar('tab segmented active icon', segActive, '--ev-tab-icon', '#ffffff')

  const lineItem = rule('.ev-tab--line')
  check('tab line pad', resolve(lineItem.get('padding')), '8px')
  // The underline is reserved as a transparent border so selecting cannot shift the row.
  check(
    'tab line reserved underline',
    resolve(lineItem.get('border-bottom')),
    '2px solid transparent',
  )

  const lineActive = merged('.ev-tab', '.ev-tab--line', '.ev-tab--line.ev-tab--selected')
  checkVar('tab line active fg', lineActive, '--ev-tab-fg', '#1b84ff')
  check(
    'tab line active underline',
    resolve(rule('.ev-tab--line.ev-tab--selected').get('border-bottom-color')),
    '#1b84ff',
  )
})

// ------------------------------------------------------------------ Tree
section('tree', () => {
  const treeReader = createReader(css)
  const base = rule('.ev-tree-item')
  check('tree row height', base.get('min-height'), '24px')
  check('tree row gap', resolve(base.get('gap')), '8px')
  check('tree row pad-y', resolve(base.get('padding-top')), '4px')
  check('tree label colour', resolve(rule('.ev-tree-item__label').get('color')), '#071437')
  check('tree label font', resolve(rule('.ev-tree-item__label').get('font-size')), '0.875rem')
  check('tree chevron colour', resolve(rule('.ev-tree-item__chevron').get('color')), '#99a1b7')

  // The eight resting surfaces are the tree/lv1-lv8 tokens, in order.
  const surfaces = [
    '#ffffff',
    '#f9f9fa',
    '#f3f4f5',
    '#eceef0',
    '#e6e8eb',
    '#dadde1',
    '#cdd1d7',
    '#c1c6cd',
  ]
  surfaces.forEach((hex, i) => {
    const lv = i + 1
    const scope = merged('.ev-tree-item', `.ev-tree-item--lv${lv}`)
    checkVar(`tree lv${lv} surface`, scope, '--ev-tree-surface', hex)
  })

  checkVar(
    'tree hover surface',
    merged('.ev-tree-item', '.ev-tree-item--lv1', '.ev-tree-item:hover'),
    '--ev-tree-surface',
    '#f9f9f9',
  )
  checkVar(
    'tree selected surface',
    merged('.ev-tree-item', '.ev-tree-item--lv1', '.ev-tree-item:hover', '.ev-tree-item--selected'),
    '--ev-tree-surface',
    '#e8f3ff',
  )

  check('tree icon colour', resolve(rule('.ev-tree-item__icon').get('color')), '#99a1b7')

  /*
   * Not a board value: the usage doc keeps expansion off the row, which makes
   * the 16px chevron the only pointer target for it. The overlay lifts that to
   * the 24px WCAG 2.5.8 minimum, so it is guarded here against regression.
   */
  check(
    'tree chevron hit area (a11y floor, not Figma)',
    rule('.ev-tree-item__chevron:after').get('inset') ??
      rule('.ev-tree-item__chevron::after').get('inset'),
    '-4px',
  )

  /*
   * The board carries a Dark frame beside the Light one. Resolving the same
   * eight surfaces against the dark token scope proves the rows re-theme
   * through `tree/lv*` rather than being pinned to the light palette.
   */
  const darkTokens = new Map(treeReader.merged(':root'))
  for (const [k, v] of treeReader.merged("[data-ev-theme='dark']", '[data-ev-theme=dark]')) {
    darkTokens.set(k, v)
  }
  const darkSurfaces = [
    '#3e424a',
    '#39414b',
    '#49525f',
    '#586472',
    '#606d7c',
    '#687586',
    '#707e90',
    '#78879a',
  ]
  darkSurfaces.forEach((hex, i) => {
    const lv = i + 1
    const scope = new Map(darkTokens)
    for (const [k, v] of rule(`.ev-tree-item--lv${lv}`)) scope.set(k, v)
    check(
      `tree lv${lv} surface [dark]`,
      treeReader.resolve(scope.get('--ev-tree-surface'), scope),
      hex,
    )
  })
})

// --------------------------------------------------------------- Tooltip
section('tooltip', () => {
  const panel = rule('.ev-tooltip__panel')
  check('tooltip radius', resolve(panel.get('border-radius')), '8px')
  check('tooltip pad', resolve(panel.get('padding')), '16px')
  check('tooltip gap', resolve(panel.get('gap')), '8px')
  checkVar('tooltip bg', merged('.ev-tooltip'), '--ev-tooltip-bg', '#3e424a')

  // The board's bubble carries elevation/xl.
  const shadow = resolve(panel.get('box-shadow'))
  check(
    'tooltip elevation xl',
    shadow && shadow.includes('20px 25px -5px') ? 'xl' : String(shadow),
    'xl',
  )

  check('tooltip title colour', resolve(rule('.ev-tooltip__title').get('color')), '#ffffff')
  check('tooltip title font', resolve(rule('.ev-tooltip__title').get('font-size')), '1rem')
  check('tooltip title weight', resolve(rule('.ev-tooltip__title').get('font-weight')), '700')
  check('tooltip body colour', resolve(rule('.ev-tooltip__body').get('color')), '#ffffff')
  check('tooltip body font', resolve(rule('.ev-tooltip__body').get('font-size')), '0.875rem')

  // DEVIATION: the arrow takes the panel's fill, not the board's grey/600 art.
  check(
    'tooltip arrow matches panel',
    resolve(rule('.ev-tooltip__arrow').get('background-color'), merged('.ev-tooltip')),
    '#3e424a',
  )

  /*
   * The board's bubble is FIXED 320. DEVIATION: the component hugs up to that
   * width instead, because a fixed 320 overflows the container on `left`.
   */
  check('tooltip max width', rule('.ev-tooltip__bubble').get('max-width'), '320px')
  check('tooltip hugs its content', rule('.ev-tooltip__bubble').get('width'), 'max-content')
  check('tooltip title row gap', resolve(rule('.ev-tooltip__title-row').get('gap')), '4px')

  // node: Slot Title - a 24x24 leading tile in the title row.
  check('tooltip slot-title size', rule('.ev-tooltip__slot-title').get('width'), '24px')
  // node: Slot Content - a VERTICAL g8 block under the message.
  check('tooltip slot-content gap', resolve(rule('.ev-tooltip__slot-content').get('gap')), '8px')
  // node: .Pagination Step - the footer row, gap 8.
  check('tooltip footer gap', resolve(rule('.ev-tooltip__footer').get('gap')), '8px')
})

// ----------------------------------------------------------- Scroll area
section('scroll-area', () => {
  const thumb = rule('.ev-scroll-area::-webkit-scrollbar-thumb')
  check('scrollbar thumb colour', resolve(thumb.get('background-color')), '#c4cada')
  check('scrollbar thumb radius', resolve(thumb.get('border-radius')), '8px')

  const bar = rule('.ev-scroll-area::-webkit-scrollbar')
  check('scrollbar width', resolve(bar.get('width')), '2px')
  check('scrollbar height', resolve(bar.get('height')), '2px')
  check(
    'scrollbar track transparent',
    rule('.ev-scroll-area::-webkit-scrollbar-track').get('background-color'),
    'transparent',
  )
})

// ----------------------------------------------------------------- Modal
section('modal', () => {
  const panel = rule('.ev-modal__panel')
  check('modal radius', resolve(panel.get('border-radius')), '12px')
  check('modal bg', resolve(panel.get('background-color')), '#ffffff')

  // The board's panel shadow is elevation/lg.
  const shadow = resolve(panel.get('box-shadow'))
  check(
    'modal elevation lg',
    shadow && shadow.includes('10px 15px -3px') ? 'lg' : String(shadow),
    'lg',
  )

  check('modal small width', rule('.ev-modal__panel--small').get('max-width'), '500px')
  check('modal medium width', rule('.ev-modal__panel--medium').get('max-width'), '720px')
  check('modal large width', rule('.ev-modal__panel--large').get('max-width'), '1042px')

  const header = rule('.ev-modal__header')
  check('modal header pad', resolve(header.get('padding')), '16px')
  check('modal header gap', resolve(header.get('gap')), '16px')
  check('modal header bg', resolve(header.get('background-color')), '#ffffff')
  check('modal heading gap', resolve(rule('.ev-modal__heading').get('gap')), '4px')

  check('modal title colour', resolve(rule('.ev-modal__title').get('color')), '#071437')
  check('modal title font', resolve(rule('.ev-modal__title').get('font-size')), '1.125rem')
  check('modal title weight', resolve(rule('.ev-modal__title').get('font-weight')), '700')
  check('modal subtext colour', resolve(rule('.ev-modal__subtext').get('color')), '#78829d')
  check('modal subtext font', resolve(rule('.ev-modal__subtext').get('font-size')), '0.875rem')

  // The footer is the one band that is not white.
  const footer = rule('.ev-modal__footer')
  check('modal footer bg', resolve(footer.get('background-color')), '#ebedf1')
  check('modal footer pad', resolve(footer.get('padding')), '16px')
  check('modal footer gap', resolve(footer.get('gap')), '8px')

  check('modal close size', rule('.ev-modal__close').get('width'), '24px')
  check('modal close colour', resolve(rule('.ev-modal__close').get('color')), '#78829d')

  // The scrim comes from the Pattern page: bg/overlay at 80%.
  const scrim = rule('.ev-modal__scrim')
  check('modal scrim colour', resolve(scrim.get('background-color')), '#181c20')
  check('modal scrim opacity', scrim.get('opacity'), '0.8')
})

// ---------------------------------------------------------------- Drawer
section('drawer', () => {
  check('drawer panel bg', resolve(rule('.ev-drawer__panel').get('background-color')), '#ffffff')
  check(
    'drawer default width',
    rule('.ev-drawer--right .ev-drawer__panel--default').get('max-width'),
    '400px',
  )
  check(
    'drawer wide width',
    rule('.ev-drawer--right .ev-drawer__panel--wide').get('max-width'),
    '700px',
  )

  const header = rule('.ev-drawer__header')
  check('drawer header pad', resolve(header.get('padding')), '24px 24px 16px')
  check('drawer header rule', resolve(header.get('border-bottom')), '1px solid #dbdfe9')
  check('drawer heading gap', resolve(rule('.ev-drawer__heading').get('gap')), '4px')
  check('drawer title font', resolve(rule('.ev-drawer__title').get('font-size')), '1.125rem')
  check('drawer title weight', resolve(rule('.ev-drawer__title').get('font-weight')), '700')
  check('drawer subtext colour', resolve(rule('.ev-drawer__subtext').get('color')), '#78829d')

  const content = rule('.ev-drawer__content')
  check('drawer content pad', resolve(content.get('padding')), '16px 24px')
  check('drawer content gap', resolve(content.get('gap')), '16px')

  const footer = rule('.ev-drawer__footer')
  check('drawer footer pad', resolve(footer.get('padding')), '16px 24px 24px')
  check('drawer footer gap', resolve(footer.get('gap')), '8px')
  check('drawer footer rule', resolve(footer.get('border-top')), '1px solid #dbdfe9')

  // The close icon is a step lighter here than in the modal.
  check('drawer close colour', resolve(rule('.ev-drawer__close').get('color')), '#99a1b7')

  const thumb = rule('.ev-drawer__thumb')
  check('drawer sheet thumb width', thumb.get('width'), '60px')
  check('drawer sheet thumb height', thumb.get('height'), '4px')
  check('drawer sheet thumb colour', resolve(thumb.get('background-color')), '#c4c8d5')

  const scrim = rule('.ev-drawer__scrim')
  check('drawer scrim colour', resolve(scrim.get('background-color')), '#181c20')
  check('drawer scrim opacity', scrim.get('opacity'), '0.8')
})

// ---------------------------------------------------------- Alert dialog
section('alert-dialog', () => {
  const panel = rule('.ev-alert-dialog__panel')
  check('alert dialog radius', resolve(panel.get('border-radius')), '12px')
  check('alert dialog bg', resolve(panel.get('background-color')), '#ffffff')
  check('alert dialog gap', resolve(panel.get('gap')), '24px')

  const shadow = resolve(panel.get('box-shadow'))
  check(
    'alert dialog elevation lg',
    shadow && shadow.includes('10px 15px -3px') ? 'lg' : String(shadow),
    'lg',
  )

  const desktop = rule('.ev-alert-dialog__panel--desktop')
  check('alert dialog desktop width', desktop.get('max-width'), '500px')
  check('alert dialog desktop pad', resolve(desktop.get('padding')), '24px 16px')
  check(
    'alert dialog desktop media',
    rule('.ev-alert-dialog__panel--desktop .ev-alert-dialog__media').get('width'),
    '180px',
  )
  check(
    'alert dialog desktop title font',
    resolve(rule('.ev-alert-dialog__panel--desktop .ev-alert-dialog__title').get('font-size')),
    '1.125rem',
  )

  const compact = rule('.ev-alert-dialog__panel--compact')
  check('alert dialog compact width', compact.get('max-width'), '296px')
  check('alert dialog compact pad', resolve(compact.get('padding')), '16px')
  check(
    'alert dialog compact media',
    rule('.ev-alert-dialog__panel--compact .ev-alert-dialog__media').get('width'),
    '40px',
  )
  check(
    'alert dialog compact media radius',
    resolve(rule('.ev-alert-dialog__panel--compact .ev-alert-dialog__media').get('border-radius')),
    '12px',
  )
  check(
    'alert dialog compact title font',
    resolve(rule('.ev-alert-dialog__panel--compact .ev-alert-dialog__title').get('font-size')),
    '1rem',
  )

  check('alert dialog body gap', resolve(rule('.ev-alert-dialog__body').get('gap')), '16px')
  check('alert dialog heading gap', resolve(rule('.ev-alert-dialog__heading').get('gap')), '4px')
  check('alert dialog actions gap', resolve(rule('.ev-alert-dialog__actions').get('gap')), '8px')
  check(
    'alert dialog description colour',
    resolve(rule('.ev-alert-dialog__description').get('color')),
    '#78829d',
  )

  // The compact tile is the only place the variant shows, so check it resolves.
  const del = merged('.ev-alert-dialog', '.ev-alert-dialog__panel--delete')
  checkVar('alert dialog delete tile bg', del, '--ev-alert-dialog-media-bg', '#fed4de')
  checkVar('alert dialog delete tile fg', del, '--ev-alert-dialog-media-fg', '#f82a5b')
})

// --------------------------------------------------------------- Popover
section('popover', () => {
  const panel = rule('.ev-popover__panel')
  check('popover radius', resolve(panel.get('border-radius')), '12px')
  check('popover pad', resolve(panel.get('padding')), '16px')
  check('popover gap', resolve(panel.get('gap')), '16px')
  check('popover bg', resolve(panel.get('background-color')), '#ffffff')
  check('popover border', resolve(panel.get('border')), '1px solid #dbdfe9')
  check('popover max width', panel.get('max-width'), '389px')

  // Unlike the tooltip and the modal, the board draws this one flat.
  check('popover has no elevation', String(panel.get('box-shadow') ?? 'none'), 'none')

  check('popover title colour', resolve(rule('.ev-popover__title').get('color')), '#071437')
  check('popover title font', resolve(rule('.ev-popover__title').get('font-size')), '0.875rem')
  check('popover title weight', resolve(rule('.ev-popover__title').get('font-weight')), '500')
  check(
    'popover description colour',
    resolve(rule('.ev-popover__description').get('color')),
    '#c4cada',
  )
  check(
    'popover description font',
    resolve(rule('.ev-popover__description').get('font-size')),
    '0.75rem',
  )

  // The board wraps Title + Description in one group at gap 4, root gap 16.
  check('popover heading gap', resolve(rule('.ev-popover__heading').get('gap')), '4px')
  // node: Form - the labelled rows sit at gap 8.
  check('popover body gap', resolve(rule('.ev-popover__body').get('gap')), '8px')
  // node: Slot - the trailing row, gap 8.
  check('popover footer gap', resolve(rule('.ev-popover__footer').get('gap')), '8px')
})

// ---------------------------------------------------------------- Slider
section('slider', () => {
  const base = merged('.ev-slider')
  check('slider track thickness', resolve(base.get('--ev-slider-thickness')), '4px')
  check('slider thumb size', resolve(base.get('--ev-slider-thumb')), '20px')

  /*
   * OFF-SYSTEM: the board paints the resting track `#64748b40` and the
   * destructive fill `#991515`. Neither is an EVOQ token (`#64748b` is
   * Tailwind slate-500), so these two assert the literal board values.
   */
  checkVar('slider track colour (off-system)', base, '--ev-slider-track', '#64748b40')
  checkVar('slider fill colour', base, '--ev-slider-fill', '#78829d')
  checkVar('slider thumb bg', base, '--ev-slider-thumb-bg', '#ffffff')
  checkVar('slider thumb border', base, '--ev-slider-thumb-border', '#dbdfe9')

  const destructive = merged('.ev-slider', '.ev-slider--destructive')
  checkVar('slider destructive track (off-system)', destructive, '--ev-slider-track', '#99151540')
  checkVar('slider destructive fill (off-system)', destructive, '--ev-slider-fill', '#991515')
  checkVar('slider destructive thumb bg', destructive, '--ev-slider-thumb-bg', '#f82a5b')

  check('slider horizontal length', rule('.ev-slider--horizontal').get('width'), '300px')
  check('slider vertical length', rule('.ev-slider--vertical').get('height'), '200px')
  check('slider disabled opacity', rule('.ev-slider--disabled').get('opacity'), '0.5')

  const track = rule('.ev-slider__track')
  check('slider track radius', resolve(track.get('border-radius')), '9999px')
  check('slider fill radius', resolve(rule('.ev-slider__fill').get('border-radius')), '9999px')

  // The board's value label is the smallest type in the system.
  const values = rule('.ev-slider__values')
  check('slider value font', resolve(values.get('font-size')), '0.5rem')
  check('slider value line-height', resolve(values.get('line-height')), '0.75rem')
  check('slider value colour', resolve(values.get('color')), '#071437')
})

// --------------------------------------------------------- Dropdown list
section('dropdown-list', () => {
  const menu = rule('.ev-dropdown-list')
  check('dropdown radius', resolve(menu.get('border-radius')), '6px')
  check('dropdown pad', resolve(menu.get('padding')), '4px 0')
  check('dropdown bg', resolve(menu.get('background-color')), '#ffffff')
  check('dropdown border', resolve(menu.get('border')), '1px solid #dbdfe9')

  // The board's menu shadow is elevation/md.
  const shadow = resolve(menu.get('box-shadow'))
  check(
    'dropdown elevation md',
    shadow && shadow.includes('4px 6px -1px') ? 'md' : String(shadow),
    'md',
  )

  check(
    'dropdown search pad',
    resolve(rule('.ev-dropdown-list__search').get('padding')),
    '8px 12px',
  )
  check(
    'dropdown search input pad',
    resolve(rule('.ev-dropdown-list__search-input').get('padding')),
    '12px',
  )
  check(
    'dropdown search input radius',
    resolve(rule('.ev-dropdown-list__search-input').get('border-radius')),
    '6px',
  )

  const item = rule('.ev-dropdown-item')
  check('dropdown item colour', resolve(item.get('color')), '#071437')
  check('dropdown item font', resolve(item.get('font-size')), '0.875rem')

  const list = rule('.ev-dropdown-item--list')
  check('dropdown list row height', list.get('min-height'), '24px')
  check('dropdown list row pad', resolve(list.get('padding')), '4px 8px')
  check('dropdown list row gap', resolve(list.get('gap')), '4px')

  const listBox = rule('.ev-dropdown-item--list-box')
  check('dropdown box row height', listBox.get('min-height'), '32px')
  check('dropdown box row pad', resolve(listBox.get('padding')), '4px 8px')
  check('dropdown box row gap', resolve(listBox.get('gap')), '8px')

  checkVar(
    'dropdown item rest bg',
    merged('.ev-dropdown-item'),
    '--ev-dropdown-item-bg',
    'transparent',
  )
  checkVar(
    'dropdown item hover bg',
    merged('.ev-dropdown-item', '.ev-dropdown-item:hover:not(.ev-dropdown-item--disabled)'),
    '--ev-dropdown-item-bg',
    '#ebedf1',
  )
  checkVar(
    'dropdown item active bg',
    merged(
      '.ev-dropdown-item',
      '.ev-dropdown-item:hover:not(.ev-dropdown-item--disabled)',
      '.ev-dropdown-item--active',
    ),
    '--ev-dropdown-item-bg',
    '#e8f3ff',
  )
})

// -------------------------------------------------------------- Carousel
section('carousel', () => {
  check('carousel gap', resolve(rule('.ev-carousel').get('gap')), '4px')
  check('carousel container gap', resolve(rule('.ev-carousel__container').get('gap')), '4px')
  check('carousel track gap', resolve(rule('.ev-carousel__track').get('gap')), '4px')

  const button = rule('.ev-carousel__button')
  check('carousel button size', button.get('width'), '32px')
  check('carousel button pad', resolve(button.get('padding')), '8px')
  check('carousel button radius', resolve(button.get('border-radius')), '9999px')
  check('carousel button bg', resolve(button.get('background-color')), '#e8f3ff')
  check('carousel button border', resolve(button.get('border')), '1px solid #a4ceff')
  check('carousel button icon', resolve(button.get('color')), '#78829d')

  check('carousel indicator gap', rule('.ev-carousel__indicator').get('gap'), '1px')

  const dot = rule('.ev-carousel__dot')
  check('carousel dot size', dot.get('width'), '4px')
  check('carousel dot radius', resolve(dot.get('border-radius')), '8px')
  check('carousel dot colour', resolve(dot.get('background-color')), '#c4cada')

  // The active dot stretches into a bar rather than changing size.
  const active = rule('.ev-carousel__dot--active')
  check('carousel active dot width', active.get('width'), '12px')
  check('carousel active dot colour', resolve(active.get('background-color')), '#1b84ff')

  const slide = rule('.ev-carousel-slide')
  check('carousel slide radius', resolve(slide.get('border-radius')), '12px')
  check('carousel slide bg', resolve(slide.get('background-color')), '#f9f9f9')
})

// ---------------------------------------------------------------- Avatar
section('avatar', () => {
  const base = merged('.ev-avatar')
  check('avatar radius', resolve(rule('.ev-avatar').get('border-radius')), '9999px')
  checkVar('avatar initials colour', base, '--ev-avatar-fg', '#ffffff')

  // size -> [circle, font, line]
  const sizes = {
    24: ['24px', '0.625rem', '1rem'],
    32: ['32px', '0.875rem', '1rem'],
    40: ['40px', '1rem', '1.25rem'],
    48: ['48px', '1.25rem', '1.5rem'],
    64: ['64px', '1.75rem', '2rem'],
    96: ['96px', '2.5rem', '3rem'],
  }
  for (const [size, [circle, font, line]] of Object.entries(sizes)) {
    const scope = merged('.ev-avatar', `.ev-avatar--${size}`)
    checkVar(`avatar ${size} circle`, scope, '--ev-avatar-size', circle)
    checkVar(`avatar ${size} font`, scope, '--ev-avatar-font', font)
    checkVar(`avatar ${size} line`, scope, '--ev-avatar-line', line)
  }

  /*
   * OFF-SYSTEM: the six tints are radial gradients whose stops are in no EVOQ
   * ramp, so these assert the literal board values.
   */
  const tints = {
    green: ['#f3ffe8', '#89ae68'],
    blue: ['#dff1ff', '#93c6ef'],
    orange: ['#ffdbc0', '#fc7b1f'],
    purple: ['#e0d4fd', '#8873bd'],
    teal: ['#e7eaea', '#2fa0a1'],
    pink: ['#ffe6ed', '#f37a98'],
  }
  for (const [name, [from, to]] of Object.entries(tints)) {
    const scope = merged('.ev-avatar', `.ev-avatar--${name}`)
    const value = String(resolve(scope.get('--ev-avatar-bg'), scope) ?? '')
    check(
      `avatar ${name} gradient (off-system)`,
      value.includes(from) && value.includes(to) ? 'ok' : value,
      'ok',
    )
  }

  // The three grey states do use tokens.
  const number = merged('.ev-avatar', '.ev-avatar--number')
  checkVar('avatar number bg', number, '--ev-avatar-bg', '#d7dbe3')
  checkVar('avatar number fg', number, '--ev-avatar-fg', '#78829d')

  const empty = merged('.ev-avatar', '.ev-avatar--empty')
  checkVar('avatar empty bg', empty, '--ev-avatar-bg', '#d7dbe3')
  checkVar('avatar empty fg', empty, '--ev-avatar-fg', '#99a1b7')

  // Figma models the stack as a negative gap; CSS needs a negative margin.
  const overlaps = { 24: '8px', 32: '10px', 40: '12px', 48: '16px', 64: '20px', 96: '32px' }
  for (const [size, px] of Object.entries(overlaps)) {
    checkVar(
      `avatar group ${size} overlap`,
      merged('.ev-avatar-group', `.ev-avatar-group--${size}`),
      '--ev-avatar-group-overlap',
      px,
    )
  }
})

// ------------------------------------------------------------- Direction
section('direction', () => {
  // node: Wrapper - the header row uses itemSpacing 10, off the 4px scale.
  check('direction header gap', resolve(rule('.ev-direction__header').get('gap')), '10px')
  // node: Top Slot - VERTICAL, gap 12.
  check('direction top-slot gap', resolve(rule('.ev-direction__top-slot').get('gap')), '12px')
  // node: Frame 3 - the footer stacks its buttons full width at gap 8.
  check('direction footer direction', rule('.ev-direction__footer').get('flex-direction'), 'column')
  check('direction footer gap', resolve(rule('.ev-direction__footer').get('gap')), '8px')

  const panel = rule('.ev-direction')
  check('direction width', panel.get('max-width'), '500px')
  check('direction radius', resolve(panel.get('border-radius')), '12px')
  check('direction bg', resolve(panel.get('background-color')), '#ffffff')

  // The board's panel shadow is elevation/md.
  const shadow = resolve(panel.get('box-shadow'))
  check(
    'direction elevation md',
    shadow && shadow.includes('4px 6px -1px') ? 'md' : String(shadow),
    'md',
  )

  const body = rule('.ev-direction__body')
  check('direction body pad', resolve(body.get('padding')), '16px')
  check('direction body gap', resolve(body.get('gap')), '16px')
  check('direction heading gap', resolve(rule('.ev-direction__heading').get('gap')), '4px')
  check('direction content gap', resolve(rule('.ev-direction__content').get('gap')), '12px')

  check('direction title colour', resolve(rule('.ev-direction__title').get('color')), '#071437')
  check('direction title font', resolve(rule('.ev-direction__title').get('font-size')), '1.125rem')
  check('direction title weight', resolve(rule('.ev-direction__title').get('font-weight')), '700')
  check('direction subtext colour', resolve(rule('.ev-direction__subtext').get('color')), '#78829d')

  // Like the modal, the footer is the one band that is not white.
  const footer = rule('.ev-direction__footer')
  check('direction footer bg', resolve(footer.get('background-color')), '#ebedf1')
  check('direction footer pad', resolve(footer.get('padding')), '16px')
  check('direction footer gap', resolve(footer.get('gap')), '8px')
})

// ---------------------------------------------------------- Button group
section('button-group', () => {
  const item = rule('.ev-button-group__item')
  check('button group font', resolve(item.get('font-size')), '0.75rem')
  check('button group weight', resolve(item.get('font-weight')), '500')

  const large = rule('.ev-button-group__item--large')
  check('button group large height', large.get('min-height'), '40px')
  check('button group large pad', resolve(large.get('padding')), '12px 16px')
  check('button group large gap', resolve(large.get('gap')), '4px')

  const small = rule('.ev-button-group__item--small')
  check('button group small height', small.get('min-height'), '32px')
  check('button group small pad', resolve(small.get('padding')), '8px')
  check('button group small gap', resolve(small.get('gap')), '2px')

  // Figma's `Type` is positional, so the radius comes from child selectors.
  check(
    'button group first radius',
    resolve(rule('.ev-button-group__item:first-child').get('border-top-left-radius')),
    '8px',
  )
  check(
    'button group last radius',
    resolve(rule('.ev-button-group__item:last-child').get('border-top-right-radius')),
    '8px',
  )

  // variant -> [bg, hover, divider, fg]
  const variants = {
    'default-light': ['#f9f9f9', '#d7dbe3', '#c4cada', '#071437'],
    'default-white': ['#ffffff', '#d7dbe3', '#c4cada', '#071437'],
    primary: ['#1b84ff', '#166acc', '#166acc', '#ffffff'],
    destructive: ['#f82a5b', '#c62249', '#c62249', '#ffffff'],
    warning: ['#f9c339', '#c79c2e', '#c79c2e', '#071437'],
  }
  for (const [name, [bg, hover, divider, fg]] of Object.entries(variants)) {
    const scope = merged('.ev-button-group__item', `.ev-button-group__item--${name}`)
    checkVar(`button group ${name} bg`, scope, '--ev-button-group-item-bg', bg)
    checkVar(`button group ${name} hover`, scope, '--ev-button-group-item-bg-hover', hover)
    checkVar(`button group ${name} divider`, scope, '--ev-button-group-item-divider', divider)
    checkVar(`button group ${name} fg`, scope, '--ev-button-group-item-fg', fg)
  }
})

// -------------------------------------------------------- Navigation menu
section('navigation-menu', () => {
  const bar = rule('.ev-navigation-menu')
  check('nav bar height', bar.get('min-height'), '72px')
  check('nav bar pad', resolve(bar.get('padding')), '16px 24px')
  check('nav bar gap', resolve(bar.get('gap')), '48px')
  check('nav bar bg', resolve(bar.get('background-color')), '#ffffff')
  // Written as one grouped rule in the SCSS; query a single part of the group.
  check('nav cluster gap', resolve(rule('.ev-navigation-menu__start').get('gap')), '16px')

  const item = rule('.ev-nav-menu-item')
  check('nav item height', item.get('min-height'), '32px')
  check('nav item gap', resolve(item.get('gap')), '4px')
  check('nav item rest colour', resolve(item.get('color')), '#78829d')
  check('nav item font', resolve(item.get('font-size')), '0.875rem')

  check('nav icon pill size', rule('.ev-nav-menu-item--icon').get('width'), '32px')
  check(
    'nav icon pill radius',
    resolve(rule('.ev-nav-menu-item--icon').get('border-radius')),
    '6px',
  )
  check(
    'nav text pill radius',
    resolve(rule('.ev-nav-menu-item--text').get('border-radius')),
    '9999px',
  )
  check(
    'nav icon-text pad',
    resolve(rule('.ev-nav-menu-item--icon-text').get('padding')),
    '8px 12px 8px 8px',
  )

  // The two active treatments differ on purpose - a pill with an icon, plain
  // brand-blue text without one.
  check('nav active weight', resolve(rule('.ev-nav-menu-item--active').get('font-weight')), '700')
  check(
    'nav active pill bg',
    resolve(rule('.ev-nav-menu-item--active.ev-nav-menu-item--icon-text').get('background-color')),
    '#1b84ff',
  )
  check(
    'nav active text colour',
    resolve(rule('.ev-nav-menu-item--active.ev-nav-menu-item--text').get('color')),
    '#1b84ff',
  )
})

// ----------------------------------------------------------------- Chart
section('chart', () => {
  const base = rule('.ev-chart')
  check('chart gap', resolve(base.get('gap')), '16px')

  const card = rule('.ev-chart--card')
  check('chart card pad', resolve(card.get('padding')), '24px')
  check('chart card radius', resolve(card.get('border-radius')), '8px')
  check('chart card bg', resolve(card.get('background-color')), '#ffffff')

  check('chart header gap', resolve(rule('.ev-chart__header').get('gap')), '12px')
  check('chart information gap', resolve(rule('.ev-chart__information').get('gap')), '4px')
  check('chart content gap', resolve(rule('.ev-chart__content').get('gap')), '8px')
  check('chart summary gap', resolve(rule('.ev-chart__summary').get('gap')), '16px')
  check('chart legend gap', resolve(rule('.ev-chart__legend').get('gap')), '8px')
  check('chart title font', resolve(rule('.ev-chart__title').get('font-size')), '1.125rem')
  check('chart title weight', resolve(rule('.ev-chart__title').get('font-weight')), '700')
  check('chart subtext colour', resolve(rule('.ev-chart__subtext').get('color')), '#78829d')
})

// ----------------------------------------------------------------- Input
section('input', () => {
  const field = rule('.ev-input__field')
  check('input height', field.get('min-height'), '44px')
  check('input pad', resolve(field.get('padding')), '12px')
  check('input gap', resolve(field.get('gap')), '8px')
  check('input radius', resolve(field.get('border-radius')), '6px')

  const rest = merged('.ev-input')
  checkVar('input bg', rest, '--ev-input-bg', '#ffffff')
  checkVar('input border', rest, '--ev-input-border', '#dbdfe9')
  checkVar('input value colour', rest, '--ev-input-fg', '#071437')
  checkVar('input placeholder colour', rest, '--ev-input-placeholder', '#c4cada')
  checkVar('input message colour', rest, '--ev-input-message', '#78829d')

  check(
    'input focus border',
    resolve(rule('.ev-input__field:focus-within').get('border-color')),
    '#1b84ff',
  )

  const error = merged('.ev-input', '.ev-input--error')
  checkVar('input error border', error, '--ev-input-border', '#f82a5b')
  checkVar('input error value', error, '--ev-input-fg', '#c62249')
  checkVar('input error message', error, '--ev-input-message', '#f82a5b')

  const disabled = merged('.ev-input', '.ev-input--disabled')
  checkVar('input disabled bg', disabled, '--ev-input-bg', '#ebedf1')
  checkVar('input disabled border', disabled, '--ev-input-border', '#dbdfe9')

  check('input control font', resolve(rule('.ev-input__control').get('font-size')), '0.875rem')
  check('input message font', resolve(rule('.ev-input__message').get('font-size')), '0.75rem')
  check('input label font', resolve(rule('.ev-input__label').get('font-size')), '0.75rem')
  check('input required colour', resolve(rule('.ev-input__required').get('color')), '#f82a5b')
})

// -------------------------------------------------------------- Calendar
section('calendar', () => {
  const panel = rule('.ev-calendar')
  /*
   * The board sizes Basic at 312 and Range at 608 - both are the 280px panels
   * plus 16px padding either side, so the root hugs rather than pinning 312,
   * which would squash Range's two months into one column's width.
   */
  check('calendar width', panel.get('width'), 'fit-content')
  check('calendar panel width', rule('.ev-calendar__panel').get('width'), '280px')
  check('calendar pad', resolve(panel.get('padding')), '16px')
  check('calendar gap', resolve(panel.get('gap')), '16px')
  check('calendar radius', resolve(panel.get('border-radius')), '8px')
  check('calendar border', resolve(panel.get('border')), '1px solid #dbdfe9')

  check('calendar header gap', resolve(rule('.ev-calendar__header').get('gap')), '8px')
  const nav = rule('.ev-calendar__nav')
  check('calendar nav size', nav.get('width'), '28px')
  check('calendar nav radius', resolve(nav.get('border-radius')), '6px')
  check('calendar nav bg', resolve(nav.get('background-color')), '#f9f9f9')

  const day = rule('.ev-calendar__day')
  check('calendar day size', day.get('width'), '40px')
  check('calendar day radius', resolve(day.get('border-radius')), '8px')
  check('calendar day colour', resolve(day.get('color')), '#071437')
  check('calendar weekday colour', resolve(rule('.ev-calendar__weekday').get('color')), '#78829d')

  // The eight DayCell states.
  check(
    'calendar today border',
    resolve(rule('.ev-calendar__day--today').get('border-color')),
    '#1b84ff',
  )
  check(
    'calendar today radius',
    resolve(rule('.ev-calendar__day--today').get('border-radius')),
    '6px',
  )
  check(
    'calendar selected bg',
    resolve(rule('.ev-calendar__day--selected').get('background-color')),
    '#1b84ff',
  )
  check(
    'calendar selected fg',
    resolve(rule('.ev-calendar__day--selected').get('color')),
    '#ffffff',
  )
  check(
    'calendar range end radius (left)',
    resolve(rule('.ev-calendar__day--l-select').get('border-radius')),
    '6px 0 0 6px',
  )
  check(
    'calendar range end radius (right)',
    resolve(rule('.ev-calendar__day--r-select').get('border-radius')),
    '0 6px 6px 0',
  )
  check(
    'calendar range band bg',
    resolve(rule('.ev-calendar__day--range').get('background-color')),
    '#e8f3ff',
  )
  check('calendar range band fg', resolve(rule('.ev-calendar__day--range').get('color')), '#1b84ff')
  check(
    'calendar outside colour',
    resolve(rule('.ev-calendar__day--outside').get('color')),
    '#c4cada',
  )
  check(
    'calendar disabled colour',
    resolve(rule('.ev-calendar__day--disabled').get('color')),
    '#dbdfe9',
  )

  /*
   * Structure. `Frame 8` stacks the weekday row over the day rows at gap 4,
   * and the day rows themselves sit flush - the board leaves no gap between
   * weeks. `Frame 12` puts the Range variant's two panels side by side at 16.
   */
  check('calendar grid gap', resolve(rule('.ev-calendar__grid').get('gap')), '4px')
  check('calendar grid direction', rule('.ev-calendar__grid').get('flex-direction'), 'column')
  check('calendar week rows are flush', rule('.ev-calendar__weekdays').get('gap'), '0')
  check('calendar months gap', resolve(rule('.ev-calendar__months').get('gap')), '16px')
  check('calendar panel gap', resolve(rule('.ev-calendar__panel').get('gap')), '8px')

  /*
   * node: Filter - the preset row sits BELOW the calendar and the two Preset
   * variants move the padding off the root onto each band.
   */
  const filter = rule('.ev-calendar__filter')
  check('calendar filter pad', resolve(filter.get('padding')), '16px 8px')
  check('calendar filter gap', resolve(filter.get('gap')), '8px')
  check('calendar filter wraps', filter.get('flex-wrap'), 'wrap')
  check('calendar sectioned root pad', resolve(rule('.ev-calendar--sectioned').get('padding')), '0')
  check('calendar sectioned root gap', resolve(rule('.ev-calendar--sectioned').get('gap')), '0')
  check(
    'calendar sectioned inner pad',
    resolve(rule('.ev-calendar--sectioned .ev-calendar__calendar').get('padding')),
    '16px',
  )

  const preset = rule('.ev-calendar__preset')
  check('calendar preset height', preset.get('min-height'), '32px')
  check('calendar preset pad', resolve(preset.get('padding')), '8px')
  check('calendar preset radius', resolve(preset.get('border-radius')), '6px')
  check('calendar preset bg', resolve(preset.get('background-color')), '#ffffff')
  check('calendar preset fg', resolve(preset.get('color')), '#071437')

  // node: Frame 19 - the range read-out then Cancel then Apply.
  check('calendar footer gap', resolve(rule('.ev-calendar__footer-row').get('gap')), '8px')
  const cancel = merged('.ev-calendar__btn', '.ev-calendar__btn--cancel')
  check('calendar cancel bg', resolve(cancel.get('background-color')), '#f1f1f4')
  check('calendar cancel border', resolve(cancel.get('border-color')), '#dbdfe9')
  check('calendar cancel fg', resolve(cancel.get('color')), '#071437')
  const apply = merged('.ev-calendar__btn', '.ev-calendar__btn--apply')
  check('calendar apply bg', resolve(apply.get('background-color')), '#1b84ff')
  check('calendar apply fg', resolve(apply.get('color')), '#ffffff')

  /*
   * node: Frame 2 / Frame 8 - the Month and Year grids reuse `.DayCell` at
   * 93x40, wrapping three across with no column gap and a row gap of 8.
   */
  const cells = rule('.ev-calendar__cells')
  check('calendar cells columns', cells.get('grid-template-columns'), 'repeat(3,93px)')
  check('calendar cells column gap', resolve(cells.get('column-gap')), '0')
  check('calendar cells row gap', resolve(cells.get('row-gap')), '8px')
  check('calendar wide cell width', rule('.ev-calendar__day--wide').get('width'), '93px')

  /*
   * node: Date - the Full Calendar variant stacks month blocks at gap 8 inside
   * a scroller, each labelling itself instead of paging.
   */
  const full = rule('.ev-calendar__full')
  check('calendar full gap', resolve(full.get('gap')), '8px')
  check('calendar full scrolls', full.get('overflow-y'), 'auto')
  check('calendar block gap', resolve(rule('.ev-calendar__block').get('gap')), '4px')

  /*
   * node: DropdownList - Month Open / Year Open float over the header. The
   * board instances the DropdownList component itself, so the panel's own
   * section already covers its 6px radius, #dbdfe9 stroke and elevation/md.
   */
  const overlay = rule('.ev-calendar__overlay')
  check('calendar overlay floats', overlay.get('position'), 'absolute')
  check('calendar overlay min width', overlay.get('min-width'), '106px')
  check('calendar month label is a button', rule('.ev-calendar__month').get('cursor'), 'pointer')

  /*
   * node: Frame 26 - the mobile read-out, 14 Bold in the brand colour, and the
   * mobile footer splits its two buttons evenly where desktop right-aligns.
   */
  const readout = rule('.ev-calendar__readout')
  check('calendar readout gap', resolve(readout.get('gap')), '8px')
  check('calendar readout height', readout.get('height'), '16px')
  const readoutValue = rule('.ev-calendar__readout-value')
  check('calendar readout colour', resolve(readoutValue.get('color')), '#1b84ff')
  check('calendar readout weight', resolve(readoutValue.get('font-weight')), '700')
  check(
    'calendar mobile footer splits evenly',
    rule('.ev-calendar--mobile .ev-calendar__footer-row .ev-calendar__btn').get('flex'),
    // The minifier collapses the equivalent `1 1 0%` to `1`.
    '1',
  )
  check(
    'calendar mobile chevron is bare',
    resolve(rule('.ev-calendar--mobile .ev-calendar__nav').get('background-color')),
    'transparent',
  )
  check(
    'calendar mobile chevron size',
    rule('.ev-calendar--mobile .ev-calendar__nav').get('width'),
    '24px',
  )

  // node: ButtonLink - "Select Time", padded 8 top and bottom.
  const link = rule('.ev-calendar__time-link')
  check('calendar time link pad', resolve(link.get('padding')), '8px 0')
  check('calendar time link colour', resolve(link.get('color')), '#071437')
})

// ---------------------------------------------------------- Chart series
section('chart-series', () => {
  /*
   * The `PieChart` board draws five slices, and every one is an EVOQ token.
   * These assert the series palette resolves to exactly those five colours.
   */
  const boardSlices = ['#1b84ff', '#17c653', '#f9c339', '#c54a16', '#f82a5b']
  boardSlices.forEach((hex, i) => {
    checkVar(`chart series ${i + 1}`, merged(':root'), `--ev-chart-series-${i + 1}`, hex)
  })

  // Chart chrome.
  checkVar('chart axis colour', merged(':root'), '--ev-chart-axis', '#dbdfe9')
  checkVar('chart axis label colour', merged(':root'), '--ev-chart-axis-label', '#78829d')
  checkVar('chart grid colour', merged(':root'), '--ev-chart-grid', '#f1f1f4')

  /*
   * The bridge onto Unovis. Resolving `--vis-color0` through the chart's own
   * scope proves a chart is painted from the token layer rather than from
   * Unovis's defaults - which is what makes it follow a theme or brand change
   * with no JavaScript.
   */
  const chartScopes = ['.ev-bar-chart', '.ev-line-chart', '.ev-pie-chart']
  for (const selector of chartScopes) {
    const scope = merged(':root', selector)
    const name = selector.replace('.ev-', '').replace('-chart', '')
    boardSlices.forEach((hex, i) => {
      checkVar(`${name} bridge --vis-color${i}`, scope, `--vis-color${i}`, hex)
    })
    checkVar(`${name} bridge tooltip bg`, scope, '--vis-tooltip-background-color', '#3e424a')
    checkVar(`${name} bridge axis tick`, scope, '--vis-axis-tick-color', '#dbdfe9')
  }
})

// ------------------------------------------------------------- Rich Editor
/*
 * Traced from `Input / InputRichEditor` (7 State variants) and the `.RichEditor`
 * toolbar set it embeds (`Type=Big`, 19 controls + 7 separators).
 *
 * The node is three siblings under a VERTICAL root with gap 4 - Content, then
 * the toolbar, then the validation row. The toolbar is its own bordered box
 * BELOW the field, not a strip inside it, and the board draws no notched label.
 */
section('rich-editor', () => {
  const root = rule('.ev-rich-editor')
  check('rich-editor root gap', resolve(root.get('gap')), '4px')
  check('rich-editor root direction', root.get('flex-direction'), 'column')

  // Content - h 80 FIXED, pad 8, gap 4, r6, stroke #c4cada INSIDE 1.
  const content = rule('.ev-rich-editor__content')
  const scope = merged('.ev-rich-editor')
  check('rich-editor content height', content.get('height'), '80px')
  check('rich-editor content pad', resolve(content.get('padding')), '8px')
  check('rich-editor content gap', resolve(content.get('gap')), '4px')
  check('rich-editor content radius', resolve(content.get('border-radius')), '6px')
  check('rich-editor content border', resolve(content.get('border'), scope), '1px solid #c4cada')
  check('rich-editor content bg', resolve(content.get('background-color'), scope), '#ffffff')

  // The body text - `.InputType` variant `Placeholder-active`.
  const body = rule('.ev-rich-editor__body')
  check('rich-editor body font', body.get('font-size'), '14px')
  check('rich-editor body weight', body.get('font-weight'), '500')
  check('rich-editor body line-height', body.get('line-height'), '16px')
  check('rich-editor body colour', resolve(body.get('color'), scope), '#071437')

  // `.InputType` variants `Title` (12px) and `Placeholder-default` (14px).
  const title = rule('.ev-rich-editor__empty--title')
  check('rich-editor title font', title.get('font-size'), '12px')
  check('rich-editor title colour', title.get('color'), '#78829d')
  check('rich-editor title gap', title.get('gap'), '10px')
  const ph = rule('.ev-rich-editor__empty--placeholder')
  check('rich-editor placeholder font', ph.get('font-size'), '14px')
  check('rich-editor placeholder colour', ph.get('color'), '#c4cada')
  check('rich-editor required colour', rule('.ev-rich-editor__required').get('color'), '#f82a5b')

  // .RichEditor Type=Big - h 36 FIXED, pad 8/12, gap 8, r5, stroke #dbdfe9 INSIDE 1.
  const toolbar = rule('.ev-rich-editor__toolbar')
  check('rich-editor toolbar height', toolbar.get('height'), '36px')
  check('rich-editor toolbar pad', resolve(toolbar.get('padding')), '8px 12px')
  check('rich-editor toolbar gap', resolve(toolbar.get('gap')), '8px')
  check('rich-editor toolbar radius', resolve(toolbar.get('border-radius')), '5px')
  check('rich-editor toolbar border', resolve(toolbar.get('border')), '1px solid #dbdfe9')
  check('rich-editor toolbar bg', resolve(toolbar.get('background-color')), '#ffffff')
  check('rich-editor toolbar align', toolbar.get('align-items'), 'center')
  /*
   * Type=Big and Type=Small share one box - 360 vs 528 on the board is just the
   * specimen width, since the instance inside InputRichEditor is FILL. Only the
   * control count differs (19 in 8 groups vs 13 in 5), so the Small modifier
   * must not redeclare any of the box.
   */
  pass(
    'rich-editor small shares the Big box',
    rule('.ev-rich-editor__toolbar--small').size === 0,
    'no overrides',
  )

  // Separator > Line 1 - a 1px rule, 20px tall, stroke #99a1b7.
  const sep = rule('.ev-rich-editor__separator')
  check('rich-editor separator width', sep.get('width'), '1px')
  check('rich-editor separator height', sep.get('height'), '20px')
  check('rich-editor separator colour', sep.get('background-color'), '#99a1b7')

  // .ValidationText - gap 4, 12px Medium, counter right-aligned.
  const msg = rule('.ev-rich-editor__message')
  check('rich-editor message gap', resolve(msg.get('gap')), '4px')
  check('rich-editor message font', msg.get('font-size'), '12px')
  check('rich-editor message line-height', msg.get('line-height'), '16px')
  check('rich-editor message colour', resolve(msg.get('color'), scope), '#78829d')
  check('rich-editor counter align', rule('.ev-rich-editor__message-end').get('text-align'), 'right')

  // States - only the Content stroke and fill move.
  check(
    'rich-editor active border',
    resolve(rule('.ev-rich-editor--active').get('--ev-rich-editor-border')),
    '#1b84ff',
  )
  const err = merged('.ev-rich-editor', '.ev-rich-editor--error')
  checkVar('rich-editor error border', err, '--ev-rich-editor-border', '#f82a5b')
  checkVar('rich-editor error body', err, '--ev-rich-editor-fg', '#c62249')
  checkVar('rich-editor error message', err, '--ev-rich-editor-message', '#f82a5b')
  const dis = merged('.ev-rich-editor', '.ev-rich-editor--disabled')
  checkVar('rich-editor disabled border', dis, '--ev-rich-editor-border', '#dbdfe9')
  checkVar('rich-editor disabled bg', dis, '--ev-rich-editor-bg', '#ebedf1')

  // Has Scroll - the 2px bar, #dbdfe9 track under a #c4cada thumb.
  check(
    'rich-editor scrollbar width',
    rule('.ev-rich-editor--scroll .ev-rich-editor__body::-webkit-scrollbar').get('width'),
    '2px',
  )
  check(
    'rich-editor scrollbar track',
    rule('.ev-rich-editor--scroll .ev-rich-editor__body::-webkit-scrollbar-track').get(
      'background-color',
    ),
    '#dbdfe9',
  )
  check(
    'rich-editor scrollbar thumb',
    rule('.ev-rich-editor--scroll .ev-rich-editor__body::-webkit-scrollbar-thumb').get(
      'background-color',
    ),
    '#c4cada',
  )
})

// ---------------------------------------------------------------- Textarea
/*
 * Traced from `Input / InputTextArea` (7 State variants). Same Content box as
 * `InputRichEditor` minus the toolbar: pad 8, gap 4, stroke `#c4cada` - a step
 * darker than InputField's `#dbdfe9` - and no notched label node.
 */
section('textarea', () => {
  const root = rule('.ev-textarea')
  check('textarea root gap', resolve(root.get('gap')), '4px')
  check('textarea root direction', root.get('flex-direction'), 'column')

  const scope = merged('.ev-textarea')
  const content = rule('.ev-textarea__content')
  check('textarea content pad', resolve(content.get('padding')), '8px')
  check('textarea content gap', resolve(content.get('gap')), '4px')
  check('textarea content radius', resolve(content.get('border-radius')), '6px')
  check('textarea content border', resolve(content.get('border'), scope), '1px solid #c4cada')
  check('textarea content bg', resolve(content.get('background-color'), scope), '#ffffff')
  check('textarea content align', content.get('align-items'), 'flex-start')

  const control = rule('.ev-textarea__control')
  check('textarea control font', control.get('font-size'), '14px')
  check('textarea control weight', control.get('font-weight'), '500')
  check('textarea control line-height', control.get('line-height'), '16px')
  check('textarea control colour', resolve(control.get('color'), scope), '#071437')
  check(
    'textarea placeholder colour',
    rule('.ev-textarea__control::placeholder').get('color'),
    '#c4cada',
  )

  // `.InputType` variant `Title` - 12px, gap 10, sitting inside Content.
  const empty = rule('.ev-textarea__empty')
  check('textarea title font', empty.get('font-size'), '12px')
  check('textarea title gap', empty.get('gap'), '10px')
  check('textarea title colour', resolve(empty.get('color'), scope), '#78829d')
  check('textarea required colour', rule('.ev-textarea__required').get('color'), '#f82a5b')

  check('textarea icon size', rule('.ev-textarea__icon').get('width'), '16px')
  check('textarea icon colour', rule('.ev-textarea__icon').get('color'), '#78829d')
  check('textarea clear size', rule('.ev-textarea__clear').get('width'), '16px')
  check('textarea clear colour', rule('.ev-textarea__clear').get('color'), '#333f47')

  const msg = rule('.ev-textarea__message')
  check('textarea message gap', resolve(msg.get('gap')), '4px')
  check('textarea message font', msg.get('font-size'), '12px')
  check('textarea message line-height', msg.get('line-height'), '16px')
  check('textarea message colour', resolve(msg.get('color'), scope), '#78829d')
  check('textarea counter align', rule('.ev-textarea__message-end').get('text-align'), 'right')

  check(
    'textarea active border',
    resolve(rule('.ev-textarea--active').get('--ev-textarea-border')),
    '#1b84ff',
  )
  const err = merged('.ev-textarea', '.ev-textarea--error')
  checkVar('textarea error border', err, '--ev-textarea-border', '#f82a5b')
  checkVar('textarea error fg', err, '--ev-textarea-fg', '#c62249')
  checkVar('textarea error message', err, '--ev-textarea-message', '#f82a5b')
  checkVar('textarea error title', err, '--ev-textarea-title', '#c62249')

  const dis = merged('.ev-textarea', '.ev-textarea--disabled')
  checkVar('textarea disabled border', dis, '--ev-textarea-border', '#dbdfe9')
  checkVar('textarea disabled bg', dis, '--ev-textarea-bg', '#ebedf1')
  checkVar('textarea disabled title', dis, '--ev-textarea-title', '#071437')

  check(
    'textarea scrollbar width',
    rule('.ev-textarea--scroll .ev-textarea__control::-webkit-scrollbar').get('width'),
    '2px',
  )
  check(
    'textarea scrollbar track',
    rule('.ev-textarea--scroll .ev-textarea__control::-webkit-scrollbar-track').get(
      'background-color',
    ),
    '#dbdfe9',
  )
  check(
    'textarea scrollbar thumb',
    rule('.ev-textarea--scroll .ev-textarea__control::-webkit-scrollbar-thumb').get(
      'background-color',
    ),
    '#c4cada',
  )
})

// -------------------------------------------------------- Input With Label
section('input-with-label', () => {
  const scope = merged('.ev-input-with-label')
  const field = rule('.ev-input-with-label__field')
  check('input-with-label height', field.get('min-height'), '44px')
  check('input-with-label radius', resolve(field.get('border-radius'), scope), '6px')
  check('input-with-label border', resolve(field.get('border'), scope), '1px solid #dbdfe9')
  check('input-with-label gap', resolve(field.get('gap')), '4px')

  // Content pads only the side with no addon: L 0,8,0,0 - R 0,0,0,8 - LR 0.
  check(
    'input-with-label pad without left addon',
    resolve(rule('.ev-input-with-label__field--pad-left').get('padding-left')),
    '8px',
  )
  check(
    'input-with-label pad without right addon',
    resolve(rule('.ev-input-with-label__field--pad-right').get('padding-right')),
    '8px',
  )

  // The Label addon - 48 wide, pad 8, gap 4, 12px text, no divider stroke.
  const addon = rule('.ev-input-with-label__addon')
  check('input-with-label addon bg', resolve(addon.get('background-color'), scope), '#ebedf1')
  check('input-with-label addon color', resolve(addon.get('color'), scope), '#071437')
  check('input-with-label addon min-width', addon.get('min-width'), '48px')
  check('input-with-label addon pad', resolve(addon.get('padding')), '8px')
  check('input-with-label addon gap', resolve(addon.get('gap')), '4px')
  check('input-with-label addon font', resolve(addon.get('font-size')), '0.75rem')
  pass(
    'input-with-label addon has no divider stroke',
    !rule('.ev-input-with-label__addon--left').get('border-right') &&
      !rule('.ev-input-with-label__addon--right').get('border-left'),
    'none, as the board draws it',
  )

  // The board draws no notched label on this set - only InputField has one.
  pass('input-with-label draws no notch', rule('.ev-input-with-label__label').size === 0, 'absent')

  const dis = merged('.ev-input-with-label', '.ev-input-with-label--disabled')
  checkVar('input-with-label disabled addon bg', dis, '--ev-input-addon-bg', '#d7dbe3')
})

// ------------------------------------------------------------ Input Search
section('input-search', () => {
  const scope = merged('.ev-input-search')
  const field = rule('.ev-input-search__field')
  // The board draws Content 44 tall - the usage doc's "compact (40px)" is wrong.
  check('input-search height', field.get('height'), '44px')
  check('input-search pad', resolve(field.get('padding')), '12px')
  check('input-search gap', resolve(field.get('gap')), '8px')
  check('input-search radius', resolve(field.get('border-radius'), scope), '6px')
  check('input-search border', resolve(field.get('border'), scope), '1px solid #dbdfe9')
  check('input-search bg', resolve(field.get('background-color'), scope), '#ffffff')

  const icon = rule('.ev-input-search__icon')
  check('input-search icon color', resolve(icon.get('color'), scope), '#78829d')
  check('input-search icon size', rule('.ev-input-search__icon svg').get('width'), '16px')
  check('input-search clear size', rule('.ev-input-search__clear svg').get('width'), '20px')

  // The search value is the one 12px field in the family.
  const control = rule('.ev-input-search__control')
  check('input-search control font', resolve(control.get('font-size')), '0.75rem')
  check('input-search value colour', resolve(control.get('color'), scope), '#071437')
  checkVar('input-search placeholder', scope, '--ev-search-placeholder', '#78829d')

  const err = merged('.ev-input-search', '.ev-input-search--error')
  checkVar('input-search error border', err, '--ev-search-border', '#f82a5b')
  checkVar('input-search error placeholder', err, '--ev-search-placeholder', '#f82a5b')

  const dis = merged('.ev-input-search', '.ev-input-search--disabled')
  checkVar('input-search disabled bg', dis, '--ev-search-bg', '#ebedf1')
  checkVar('input-search disabled placeholder', dis, '--ev-search-placeholder', '#071437')
})

// -------------------------------------------------------- Input Field Unit
section('input-field-unit', () => {
  const scope = merged('.ev-input-field-unit')

  /*
   * The board draws `Field` as a bare row of two independent inputs with gap 4,
   * NOT one merged box with a grey unit block. The row itself carries no border.
   */
  const field = rule('.ev-input-field-unit__field')
  check('input-field-unit row gap', resolve(field.get('gap')), '4px')
  pass('input-field-unit row has no border', !field.get('border'), 'none')
  pass('input-field-unit row has no radius', !field.get('border-radius'), 'none')
  pass('input-field-unit row has no fill', !field.get('background-color'), 'none')

  for (const part of ['unit-wrap', 'input-wrap']) {
    const box = rule('.ev-input-field-unit__' + part)
    check('input-field-unit ' + part + ' height', box.get('min-height'), '44px')
    check('input-field-unit ' + part + ' pad', resolve(box.get('padding')), '12px')
    check('input-field-unit ' + part + ' gap', resolve(box.get('gap')), '8px')
    check('input-field-unit ' + part + ' radius', resolve(box.get('border-radius'), scope), '6px')
    check(
      'input-field-unit ' + part + ' border',
      resolve(box.get('border'), scope),
      '1px solid #dbdfe9',
    )
    check('input-field-unit ' + part + ' bg', resolve(box.get('background-color'), scope), '#ffffff')
  }
})

// ------------------------------------------------------------- Time Picker
/*
 * Traced from `Calendar & Time Picker / M - TimePickerPopup` (4 Variants, all
 * 312x368). The board draws a wheel: a 32px band behind the columns, the value
 * at 18/24 Bold, its neighbours muted, a ":" in a 20px frame between columns,
 * and Apply stacked ABOVE Cancel. There is no title and no column caption.
 */
section('time-picker', () => {
  const scope = merged('.ev-time-picker')
  const tp = rule('.ev-time-picker')
  check('time-picker width', tp.get('width'), '312px')
  check('time-picker radius', resolve(tp.get('border-radius'), scope), '8px')
  check('time-picker border', resolve(tp.get('border'), scope), '1px solid #dbdfe9')
  check('time-picker bg', resolve(tp.get('background-color'), scope), '#ffffff')
  check('time-picker pad', resolve(tp.get('padding')), '24px 16px')
  check('time-picker gap', resolve(tp.get('gap')), '16px')

  // node: Frame 28 - the value, 14 Bold in the brand colour.
  const value = rule('.ev-time-picker__value')
  check('time-picker value colour', resolve(value.get('color'), scope), '#1b84ff')
  check('time-picker value font', resolve(value.get('font-size')), '0.875rem')
  check('time-picker value weight', resolve(value.get('font-weight')), '700')
  check('time-picker display gap', resolve(rule('.ev-time-picker__display').get('gap')), '8px')

  // node: Frame 18 / Frame 22
  const wheel = rule('.ev-time-picker__wheel')
  check('time-picker wheel height', wheel.get('height'), '184px')
  check('time-picker wheel gap', resolve(wheel.get('gap')), '8px')
  const band = rule('.ev-time-picker__band')
  check('time-picker band height', band.get('height'), '32px')
  check('time-picker band radius', resolve(band.get('border-radius')), '8px')
  check('time-picker band bg', resolve(band.get('background-color'), scope), '#ebedf1')

  // node: Frame 9 - the colon column is 20 wide, 14 Bold.
  const sep = rule('.ev-time-picker__separator')
  check('time-picker separator width', sep.get('width'), '20px')
  check('time-picker separator colour', resolve(sep.get('color'), scope), '#071437')
  check('time-picker separator weight', resolve(sep.get('font-weight')), '700')

  // The value steps up to 18/24; its neighbours stay 14 and muted.
  const selected = rule('.ev-time-picker__item--selected')
  check('time-picker selected font', resolve(selected.get('font-size')), '1.125rem')
  check('time-picker selected line', resolve(selected.get('line-height')), '1.5rem')
  check('time-picker selected weight', resolve(selected.get('font-weight')), '700')
  check('time-picker selected colour', resolve(selected.get('color'), scope), '#071437')
  const item = rule('.ev-time-picker__item')
  check('time-picker item colour', resolve(item.get('color'), scope), '#dbdfe9')
  check('time-picker item font', resolve(item.get('font-size')), '0.875rem')

  /*
   * DEVIATION: the board freezes one frame of a wheel - three neighbours at
   * 16/8 spacing around a 24px value. Rendered literally that leaves only seven
   * reachable values per column. The column scrolls instead, on a 32px pitch
   * taken from the board's own band, padded (184 - 32) / 2 so row 0 centres.
   */
  const column = rule('.ev-time-picker__column')
  check('time-picker column scrolls', column.get('overflow-y'), 'auto')
  check('time-picker column snap', column.get('scroll-snap-type'), 'y mandatory')
  check('time-picker column pad', resolve(column.get('padding')), '76px 0')
  check('time-picker item pitch', item.get('height'), '32px')
  check('time-picker item snap', item.get('scroll-snap-align'), 'center')

  // node: Frame 19 - full-width buttons stacked, Apply first.
  const footer = rule('.ev-time-picker__footer')
  check('time-picker footer direction', footer.get('flex-direction'), 'column')
  check('time-picker footer gap', resolve(footer.get('gap')), '8px')
  const btn = rule('.ev-time-picker__btn')
  check('time-picker btn height', btn.get('min-height'), '40px')
  check('time-picker btn pad', resolve(btn.get('padding')), '12px 16px')
  check('time-picker btn radius', resolve(btn.get('border-radius')), '6px')
  const apply = merged('.ev-time-picker__btn', '.ev-time-picker__btn--apply')
  check('time-picker apply bg', resolve(apply.get('background-color'), scope), '#1b84ff')
  check('time-picker apply fg', resolve(apply.get('color'), scope), '#ffffff')
  const cancel = merged('.ev-time-picker__btn', '.ev-time-picker__btn--cancel')
  check('time-picker cancel bg', resolve(cancel.get('background-color'), scope), '#e8f3ff')
  check('time-picker cancel border', resolve(cancel.get('border-color'), scope), '#a4ceff')
  check('time-picker cancel fg', resolve(cancel.get('color'), scope), '#1b84ff')

  // The board draws neither of these nodes.
  pass('time-picker draws no title', rule('.ev-time-picker__title').size === 0, 'absent')
  pass('time-picker draws no column caption', rule('.ev-time-picker__col-label').size === 0, 'absent')
})

// ----------------------------------------------------------------- Report
const total = passed.length + failed.length
for (const s of sections) console.log(`  ${s.name.padEnd(16)} ${String(s.count).padStart(4)}`)
console.log(
  `\n${total} nilai dicek terhadap spec Figma - ${passed.length} cocok, ${failed.length} beda`,
)

if (failed.length) {
  console.log('\nBEDA:')
  for (const f of failed) console.log('  ' + f)
  process.exit(1)
}
