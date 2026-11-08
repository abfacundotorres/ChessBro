import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // El motor es lógica pura: solo imports relativos y chess.js (reglas del juego).
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/__tests__/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ regex: '^(?!\\.{1,2}/|chess\\.js$)', message: 'src/engine solo puede importar módulos relativos y chess.js.' }] },
      ],
    },
  },
)
