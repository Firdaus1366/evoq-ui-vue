/**
 * Puts the Inter files into `dist/` after `vite build`, and points the
 * published stylesheet at them.
 *
 *     node scripts/bundle-fonts.mjs
 *
 * Why this is not just an `@use` in `src/styles/index.scss`: Vite's library
 * mode inlines every asset it processes as a data URI - `assetsInlineLimit` is
 * ignored there - so the four woff2 files would land in `evoq-ui.css` as ~560
 * kB of base64. That triples the stylesheet, and it defeats each face's
 * `unicode-range`: the bytes arrive whether or not the page ever shows a
 * character from that subset.
 *
 * So the faces stay in plain CSS that Vite never sees, and this copies them
 * beside the build, then prepends one `@import` to the stylesheet. A consumer
 * importing `evoq-ui/style.css` still gets the font with no extra line, and a
 * bundler resolves the fonts as real files.
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src', 'styles')
const DIST = path.join(ROOT, 'dist')
const IMPORT = "@import './fonts.css';\n"

const stylesheet = path.join(DIST, 'evoq-ui.css')
if (!fs.existsSync(stylesheet)) {
  console.error('bundle-fonts: dist/evoq-ui.css is missing - run the build first')
  process.exit(1)
}

fs.mkdirSync(path.join(DIST, 'fonts'), { recursive: true })
const files = fs.readdirSync(path.join(SRC, 'fonts'))
for (const file of files) {
  fs.copyFileSync(path.join(SRC, 'fonts', file), path.join(DIST, 'fonts', file))
}
fs.copyFileSync(path.join(SRC, 'fonts.css'), path.join(DIST, 'fonts.css'))

// `@import` has to come before every rule, so it goes at the very top.
const css = fs.readFileSync(stylesheet, 'utf8')
if (!css.startsWith(IMPORT)) fs.writeFileSync(stylesheet, IMPORT + css)

const bytes = files.reduce((n, f) => n + fs.statSync(path.join(DIST, 'fonts', f)).size, 0)
console.log(
  `${files.length} berkas font -> dist/fonts (${(bytes / 1024).toFixed(0)} kB) + dist/fonts.css`,
)
