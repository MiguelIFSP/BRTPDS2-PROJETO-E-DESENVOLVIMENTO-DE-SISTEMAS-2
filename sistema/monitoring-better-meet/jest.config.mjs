export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.mjs'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.ts$': '<rootDir>/tests/stripTypes.mjs' },
  // Valores fixos de teste: nunca dependem do .env local nem tocam em banco real.
  setupFiles: ['<rootDir>/tests/setupEnv.mjs'],
};
