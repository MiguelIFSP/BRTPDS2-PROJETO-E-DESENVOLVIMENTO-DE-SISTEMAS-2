export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.mjs'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: { '^.+\\.ts$': '<rootDir>/tests/stripTypes.mjs' },
};
