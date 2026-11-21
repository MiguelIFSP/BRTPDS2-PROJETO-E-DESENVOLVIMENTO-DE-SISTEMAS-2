import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';
import { bearer, createPrismaMock } from './helpers.mjs';

const prisma = createPrismaMock();
jest.unstable_mockModule('../src/config/database.ts', () => ({ prisma }));
jest.unstable_mockModule('../src/jobs/healthCheckJob.ts', () => ({
  healthCheckJob: { runSingle: jest.fn(async () => true), start: jest.fn() },
}));

const { createApp } = await import('../src/app.ts');
const base = '/api';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('cabeçalhos e CORS', () => {
  const app = createApp({ rateLimit: false });

  test('helmet adiciona x-content-type-options', async () => {
    const response = await request(app).get('/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('origem não listada não recebe access-control-allow-origin', async () => {
    const response = await request(app)
      .options(`${base}/status`)
      .set('Origin', 'http://malicioso.com')
      .set('Access-Control-Request-Method', 'GET');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('origem listada recebe o cabeçalho', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://painel.teste');
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://painel.teste',
    );
  });

  test('/health responde sem token', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('limites e erros', () => {
  const app = createApp({ rateLimit: true });

  test('corpo maior que o limite: 413 em português', async () => {
    const response = await request(app)
      .post(`${base}/status/report`)
      .set('Authorization', bearer())
      .send({ message: 'x'.repeat(11 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: 'Corpo da requisição grande demais.',
    });
  });

  test('prefixo antigo /monitoring-better-meet: 404 em JSON', async () => {
    const response = await request(app).get('/monitoring-better-meet/status');
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual({ error: 'Rota não encontrada.' });
  });

  test('rota inexistente: 404 em JSON', async () => {
    const response = await request(app).get('/nao-existe');
    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toEqual({ error: 'Rota não encontrada.' });
  });

  test('11ª chamada de POST /status/report na mesma janela: 429', async () => {
    const corpo = {
      subSystem: 'mobile-app',
      status: 'ERROR',
      message: 'falha',
    };
    let ultima;
    for (let i = 0; i < 11; i++) {
      ultima = await request(app)
        .post(`${base}/status/report`)
        .set('Authorization', bearer())
        .send(corpo);
    }
    expect(ultima.status).toBe(429);
    expect(ultima.body.error).toMatch(
      /^Muitas tentativas\. Tente novamente em \d+ segundos\.$/,
    );
    expect(
      ultima.headers['retry-after'] ?? ultima.headers.ratelimit,
    ).toBeDefined();
  });
});
