import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

/*
 * Atomic layers: a component may only import from layers below its own.
 * Each entry is a regex on the import specifier, so it catches both the
 * relative form (`../../organisms/x`) and the `@/organisms/x` alias.
 */
const layer = (name) => ({
  regex: `(^|/)${name}(/|$)`,
  message: `This layer may not import from src/${name} - see AGENTS.md "Atomic layers".`,
})
// `../other/...` - a sibling folder inside the same layer. `../../x` is not matched.
const sibling = (what) => ({
  regex: '^\\.\\./(?!\\.\\./)',
  message: `${what} may not import another component of the same layer - see AGENTS.md "Atomic layers".`,
})
// The chart wrappers are a separate entry point; importing them from the main
// entry would drag the optional Unovis peer into every consumer's bundle.
const charts = {
  regex: '(^|/)charts(/|$)',
  message:
    'Only the `evoq-ui/charts` entry may import src/charts - it would pull Unovis into the main bundle.',
}
const restrict = (files, patterns) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns }] },
})

export default tseslint.config(
  { ignores: ['dist/**', 'dist-playground/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // Components are published under an `Ev` prefix, so single-word names are fine.
      'vue/multi-word-component-names': 'off',

      // A component used in a template but never imported is not a syntax
      // error and not a type error - Vue just renders an unknown element and
      // warns at runtime. The playground silently lost eleven components that
      // way, so this rule is the thing that actually catches it.
      'vue/no-undef-components': 'error',
    },
  },
  restrict(
    ['src/atoms/**'],
    [
      layer('atoms'),
      layer('molecules'),
      layer('organisms'),
      layer('patterns'),
      charts,
      sibling('An atom'),
    ],
  ),
  restrict(
    ['src/molecules/**'],
    [layer('molecules'), layer('organisms'), layer('patterns'), charts, sibling('A molecule')],
  ),
  restrict(['src/organisms/**'], [layer('patterns'), charts]),
  restrict(['src/patterns/**'], [charts]),
  restrict(['src/charts/**'], [layer('patterns')]),
  prettier,
)
