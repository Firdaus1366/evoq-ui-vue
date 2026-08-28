/**
 * The `.RichEditor` toolbar, traced from the Figma component set of the same
 * name (`Input` page). It ships two types:
 *
 *   Type=Big   - 528x36, 19 controls in 8 groups (7 separators)
 *   Type=Small - 360x36, 13 controls in 5 groups (4 separators)
 *
 * Both share the same box: r5, `#ffffff`, 1px `#dbdfe9` inside stroke,
 * padding 8/12, gap 8, items centred, 16x16 glyphs in `#78829d`.
 *
 * The groups differ by more than omission - `format_underlined` sits with
 * bold/italic in Big but joins the text-size group in Small - so the two
 * orders are listed out rather than derived from one another.
 */

export type RichEditorTool =
  | 'undo'
  | 'redo'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'textIncrease'
  | 'textDecrease'
  | 'colorText'
  | 'borderColor'
  | 'bulleted'
  | 'numbered'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'emoji'
  | 'link'
  | 'image'
  | 'attach'
  | 'clear'

export type RichEditorToolbarType = 'big' | 'small'

/** One drawable node of a glyph: an SVG tag plus its attributes. */
export interface IconNode {
  tag: 'path' | 'circle' | 'rect'
  [attribute: string]: string | number
}

const STROKE: Record<string, string | number> = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1.4,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
}

/** A 2px bar under the glyph - the swatch on the two colour tools. */
const SWATCH: IconNode = {
  tag: 'rect',
  x: 2.5,
  y: 12.5,
  width: 11,
  height: 2,
  rx: 0.6,
  fill: 'currentColor',
}

/** The three rules that stand in for text beside a list marker. */
const LIST_RULES: IconNode = { tag: 'path', d: 'M5.8 4h8M5.8 8h8M5.8 12h8', ...STROKE }

export const RICH_EDITOR_ICONS: Record<RichEditorTool, IconNode[]> = {
  undo: [{ tag: 'path', d: 'M3.5 6.5h6a3 3 0 0 1 0 6H8M3.5 6.5 6 4M3.5 6.5 6 9', ...STROKE }],
  redo: [{ tag: 'path', d: 'M12.5 6.5h-6a3 3 0 0 0 0 6H8M12.5 6.5 10 4M12.5 6.5 10 9', ...STROKE }],
  bold: [
    {
      tag: 'path',
      d: 'M5 3h3.6a2.2 2.2 0 0 1 0 4.4H5zm0 4.4h4a2.3 2.3 0 0 1 0 4.6H5z',
      ...STROKE,
      'stroke-width': 1.5,
    },
  ],
  italic: [{ tag: 'path', d: 'M6.5 3h4.5M5 13h4.5M9.5 3 7 13', ...STROKE }],
  underline: [{ tag: 'path', d: 'M4.5 2.5v4.8a3.5 3.5 0 0 0 7 0V2.5M3.5 13.5h9', ...STROKE }],
  textIncrease: [
    { tag: 'path', d: 'M1 12.5 4.25 3.5 7.5 12.5M2.2 9.8h4.1M10.5 8h4M12.5 6v4', ...STROKE },
  ],
  textDecrease: [{ tag: 'path', d: 'M1 12.5 4.25 3.5 7.5 12.5M2.2 9.8h4.1M10.5 8h4', ...STROKE }],
  colorText: [{ tag: 'path', d: 'M3 10.5 6.5 2l3.5 8.5M4.3 8.2h4.4', ...STROKE }, SWATCH],
  borderColor: [{ tag: 'path', d: 'M9.8 1.9 12.6 4.7 6.4 10.9H3.6V8.1z', ...STROKE }, SWATCH],
  bulleted: [
    { tag: 'circle', cx: 2.6, cy: 4, r: 1.1, fill: 'currentColor' },
    { tag: 'circle', cx: 2.6, cy: 8, r: 1.1, fill: 'currentColor' },
    { tag: 'circle', cx: 2.6, cy: 12, r: 1.1, fill: 'currentColor' },
    LIST_RULES,
  ],
  numbered: [
    {
      tag: 'path',
      d: 'M1.4 2.6h.9v2.6M1.3 8.1h1.6L1.3 10.4h1.7M1.3 11.9h1.6v1.1H1.9h1v1.1H1.3',
      ...STROKE,
      'stroke-width': 1,
    },
    LIST_RULES,
  ],
  alignLeft: [{ tag: 'path', d: 'M2 3.5h12M2 7h8M2 10.5h12M2 14h8', ...STROKE }],
  alignCenter: [{ tag: 'path', d: 'M2 3.5h12M4 7h8M2 10.5h12M4 14h8', ...STROKE }],
  alignRight: [{ tag: 'path', d: 'M2 3.5h12M6 7h8M2 10.5h12M6 14h8', ...STROKE }],
  emoji: [
    {
      tag: 'circle',
      cx: 8,
      cy: 8,
      r: 6.3,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.4,
    },
    { tag: 'circle', cx: 5.9, cy: 6.4, r: 0.9, fill: 'currentColor' },
    { tag: 'circle', cx: 10.1, cy: 6.4, r: 0.9, fill: 'currentColor' },
    { tag: 'path', d: 'M5.4 9.8a3.1 3.1 0 0 0 5.2 0', ...STROKE },
  ],
  link: [
    {
      tag: 'path',
      d: 'M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.1-2.1a2.6 2.6 0 0 0-3.7-3.7l-1 1M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.4 8.9a2.6 2.6 0 0 0 3.7 3.7l1-1',
      ...STROKE,
    },
  ],
  image: [
    {
      tag: 'rect',
      x: 1.9,
      y: 2.9,
      width: 12.2,
      height: 10.2,
      rx: 1.4,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 1.4,
    },
    { tag: 'circle', cx: 5.6, cy: 6.3, r: 1.1, fill: 'currentColor' },
    { tag: 'path', d: 'm2.4 11.6 3.3-3 3 2.6 2-1.7 2.9 2.5', ...STROKE },
  ],
  attach: [
    {
      tag: 'path',
      d: 'M11.3 7.6 7.1 11.8a2.4 2.4 0 0 1-3.4-3.4l4.8-4.8a1.6 1.6 0 0 1 2.3 2.3l-4.8 4.8a.8.8 0 0 1-1.2-1.1l4.3-4.3',
      ...STROKE,
    },
  ],
  clear: [
    {
      tag: 'path',
      d: 'M2.6 4.2h10.8M6.3 4.2V2.8h3.4v1.4M4 4.2l.7 8.4a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9L12 4.2M6.6 6.8v4M9.4 6.8v4',
      ...STROKE,
    },
  ],
}

export const RICH_EDITOR_TITLES: Record<RichEditorTool, string> = {
  undo: 'Urungkan',
  redo: 'Ulangi',
  bold: 'Tebal',
  italic: 'Miring',
  underline: 'Garis bawah',
  textIncrease: 'Perbesar teks',
  textDecrease: 'Perkecil teks',
  colorText: 'Warna teks',
  borderColor: 'Warna sorot',
  bulleted: 'Daftar berpoin',
  numbered: 'Daftar bernomor',
  alignLeft: 'Rata kiri',
  alignCenter: 'Rata tengah',
  alignRight: 'Rata kanan',
  emoji: 'Emoji',
  link: 'Sisipkan tautan',
  image: 'Sisipkan gambar',
  attach: 'Lampirkan berkas',
  clear: 'Hapus semua',
}

/** Groups are separated by one rule each, so N groups draw N-1 separators. */
export const RICH_EDITOR_GROUPS: Record<RichEditorToolbarType, RichEditorTool[][]> = {
  big: [
    ['undo', 'redo'],
    ['bold', 'italic', 'underline'],
    ['textIncrease', 'textDecrease'],
    ['colorText', 'borderColor'],
    ['bulleted', 'numbered'],
    ['alignLeft', 'alignCenter', 'alignRight'],
    ['emoji', 'link', 'image', 'attach'],
    ['clear'],
  ],
  small: [
    ['bold', 'italic'],
    ['underline', 'textIncrease', 'textDecrease'],
    ['colorText', 'borderColor'],
    ['bulleted', 'numbered'],
    ['emoji', 'link', 'image', 'attach'],
  ],
}
