// O preset nativo redefine window; os testes de HTML precisam do DOM do navegador.
module.exports = {
  preset: 'jest-expo/web',
  testMatch: ['<rootDir>/src/web-tests/**/*.test.ts'],
};
