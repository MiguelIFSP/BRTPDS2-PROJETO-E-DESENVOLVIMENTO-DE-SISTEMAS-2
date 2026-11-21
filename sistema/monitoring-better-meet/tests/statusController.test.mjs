import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';
import { INTERNAL_API_KEY, bearer, createPrismaMock } from './helpers.mjs';

const prisma = createPrismaMock();
const runSingle = jest.fn();
jest.unstable_mockModule('../src/config/database.ts', () => ({ prisma }));
jest.unstable_mockModule('../src/jobs/healthCheckJob.ts', () => ({
  healthCheckJob: { runSingle, start: jest.fn() },
}));

const { createApp } = await import('../src/app.ts');
const app = createApp({ rateLimit: false });
const base = '/api';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /status (chave interna)', () => {
  const enviar = (body) =>
    request(app)
      .post(`${base}/status`)
      .set('x-api-key', INTERNAL_API_KEY)
      .send(body);

  test('201 com corpo válido', async () => {
    const response = await enviar({ subSystem: 'management', status: 'DOWN' });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ status: 'DOWN', message: null });
  });

  test('400 sem status', async () => {
    const response = await enviar({ subSystem: 'management' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('status é obrigatório.');
  });

  test('400 com status fora da lista', async () => {
    const response = await enviar({ subSystem: 'management', status: 'BOM' });
    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/^status inválido/);
  });

  test('401 sem chave', async () => {
    const response = await request(app)
      .post(`${base}/status`)
      .send({ subSystem: 'management', status: 'DOWN' });
    expect(response.status).toBe(401);
  });
});

describe('GET /status/:subSystemId/history', () => {
  const get = (path) =>
    request(app).get(`${base}${path}`).set('Authorization', bearer());

  test.each(['abc', '0', '-1', '1.5'])('id %s vira 400', async (id) => {
    const response = await get(`/status/${id}/history`);
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Identificador do subsistema inválido.');
  });

  test('id inexistente vira 404', async () => {
    prisma.subSystem.findUnique.mockResolvedValue(null);
    const response = await get('/status/99/history');
    expect(response.status).toBe(404);
  });

  test('days fora do intervalo vira 400', async () => {
    expect((await get('/status/1/history?days=91')).status).toBe(400);
  });

  test('200 com o histórico', async () => {
    prisma.subSystem.findUnique.mockResolvedValue({ id: 1, name: 'a' });
    const response = await get('/status/1/history?days=2');
    expect(response.status).toBe(200);
    expect(response.body.history).toHaveLength(2);
  });
});

describe('GET /status/daily', () => {
  const get = (path) =>
    request(app).get(`${base}${path}`).set('Authorization', bearer());

  test('data inexistente vira 400', async () => {
    const response = await get('/status/daily?date=2026-02-30');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Data inválida. Use AAAA-MM-DD.');
  });

  test('/status/daily não é capturado por /status/:subSystemId/history', async () => {
    const response = await get('/status/daily');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('erros internos', () => {
  test('500 do Prisma devolve corpo genérico', async () => {
    prisma.subSystem.findMany.mockRejectedValue(
      new Error('connect ECONNREFUSED 10.1.1.1:3307 user=root'),
    );
    const response = await request(app)
      .get(`${base}/status`)
      .set('Authorization', bearer());
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Erro interno. Tente novamente mais tarde.',
    });
    expect(response.text).not.toContain('ECONNREFUSED');
  });
});

describe('POST /status/:subSystem/check', () => {
  test('404 para subsistema desconhecido', async () => {
    runSingle.mockResolvedValue(false);
    const response = await request(app)
      .post(`${base}/status/nada/check`)
      .set('Authorization', bearer());
    expect(response.status).toBe(404);
  });

  test('200 com o status recém-gravado', async () => {
    runSingle.mockResolvedValue(true);
    prisma.subSystem.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'data-api',
        checks: [
          { status: 'OPERATIONAL', message: null, checkedAt: new Date() },
        ],
      },
    ]);
    const response = await request(app)
      .post(`${base}/status/data-api/check`)
      .set('Authorization', bearer());
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      subSystem: 'data-api',
      status: 'OPERATIONAL',
    });
  });
});
