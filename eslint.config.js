import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

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
  prettier,
)
