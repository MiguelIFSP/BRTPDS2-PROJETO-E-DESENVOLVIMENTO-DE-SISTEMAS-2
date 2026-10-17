export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'Bundler',
          isolatedModules: true,
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: ['<rootDir>/src/**/__tests__/*.test.ts'],
  clearMocks: true,
};
