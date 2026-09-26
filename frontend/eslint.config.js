// @ts-check
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Config plana de ESLint. Además de lo estándar (recommended + hooks),
 * refuerza las convenciones de `.claude/skills/convenciones-codigo/SKILL.md`:
 * 300 líneas por archivo, sin ternarios anidados, y sin `interface`/`type`
 * dentro de un `.tsx` que renderiza (esos van a `src/types/`). El límite de
 * 7 props por componente no se pudo expresar de forma fiable como regla de
 * ESLint (un selector AST sobre "más de 7 miembros" es frágil entre
 * versiones) — se revisa en cambio con `tests/structure.test.ts`.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    // Ningún .tsx que renderiza declara su propio interface/type — van en src/types/.
    files: ['src/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSInterfaceDeclaration',
          message: 'Ningún .tsx declara su propio `interface` — muévelo a src/types/ (ver convenciones-codigo).',
        },
        {
          selector: 'TSTypeAliasDeclaration',
          message: 'Ningún .tsx declara su propio `type` — muévelo a src/types/ (ver convenciones-codigo).',
        },
      ],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
);
