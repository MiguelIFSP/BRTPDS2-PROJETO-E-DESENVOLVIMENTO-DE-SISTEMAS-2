// https://docs.expo.dev/guides/using-eslint/
// Fica em CommonJS porque é o formato que o `expo lint` carrega (exceção do TS-09).
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
