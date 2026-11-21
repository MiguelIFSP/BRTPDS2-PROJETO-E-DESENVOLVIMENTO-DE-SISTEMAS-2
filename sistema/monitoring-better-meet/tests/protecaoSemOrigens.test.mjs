import { expect, jest, test } from '@jest/globals';
import request from 'supertest';
import { createPrismaMock } from './helpers.mjs';

// Definido antes do import: env.ts lê o ambiente uma única vez.
process.env.CORS_ORIGINS = '';

jest.unstable_mockModule('../src/config/database.ts', () => ({
  prisma: createPrismaMock(),
}));
const { createApp } = await import('../src/app.ts');

test('sem CORS_ORIGINS nenhuma origem de navegador recebe o cabeçalho', async () => {
  const response = await request(createApp({ rateLimit: false }))
    .get('/health')
    .set('Origin', 'http://painel.teste');
  expect(response.status).toBe(200);
  expect(response.headers['access-control-allow-origin']).toBeUndefined();
});
