// https://docs.expo.dev/guides/using-eslint/
// Fica em CommonJS porque é o formato que o `expo lint` carrega (exceção do TS-09).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      'no-restricted-syntax': ['error', 'TSEnumDeclaration'],
      'import/no-anonymous-default-export': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../*'], message: 'Use o alias @/ no lugar de ../' },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
]);
