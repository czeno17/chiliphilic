import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: { 
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Turn off warnings you don't want to see
      'no-unused-vars': 'off',
      'react/jsx-key': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-undef': 'off',
      'react-refresh/only-export-components': 'off',
      'react/prop-types': 'off',
      'no-empty': 'off',
    },
  },
])