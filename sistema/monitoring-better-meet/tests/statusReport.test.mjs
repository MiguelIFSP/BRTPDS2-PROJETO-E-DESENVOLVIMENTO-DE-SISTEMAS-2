import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';
import { INTERNAL_API_KEY, bearer, createPrismaMock } from './helpers.mjs';

const prisma = createPrismaMock();
const runSingle = jest.fn(async () => true);
jest.unstable_mockModule('../src/config/database.ts', () => ({ prisma }));
jest.unstable_mockModule('../src/jobs/healthCheckJob.ts', () => ({
  healthCheckJob: { runSingle, start: jest.fn() },
}));

const { createApp } = await import('../src/app.ts');
const app = createApp({ rateLimit: false });
const base = '/api';

const relatar = (body, authorization) => {
  const pedido = request(app).post(`${base}/status/report`);
  return (
    authorization ? pedido.set('Authorization', authorization) : pedido
  ).send(body);
};

const corpo = {
  subSystem: 'mobile-app',
  status: 'ERROR',
  message: 'Tela branca ao abrir reuniões',
  isBlocking: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  prisma.subSystem.findMany.mockResolvedValue([]);
});

describe('POST /status/report', () => {
  test('sem token: 401', async () => {
    expect((await relatar(corpo)).status).toBe(401);
  });

  test('usuário comum reporta o app: 201 e grava status e isBlocking', async () => {
    const response = await relatar(corpo, bearer({ role: 'USER' }));
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      status: 'ERROR',
      isBlocking: true,
      message: 'Tela branca ao abrir reuniões',
    });
    expect(prisma.statusCheck.create).toHaveBeenCalledTimes(1);
  });

  test('usuário comum reportando management: 403 e nada gravado', async () => {
    const response = await relatar(
      { ...corpo, subSystem: 'management' },
      bearer({ role: 'USER' }),
    );
    expect(response.status).toBe(403);
    expect(prisma.statusCheck.create).not.toHaveBeenCalled();
  });

  test('ADMIN reporta management: 201', async () => {
    const response = await relatar(
      { ...corpo, subSystem: 'management' },
      bearer({ role: 'ADMIN' }),
    );
    expect(response.status).toBe(201);
  });

  test('subSystem fora da lista: 400', async () => {
    const response = await relatar(
      { ...corpo, subSystem: 'database' },
      bearer(),
    );
    expect(response.status).toBe(400);
  });

  test('status OPERATIONAL: 400', async () => {
    const response = await relatar(
      { ...corpo, status: 'OPERATIONAL' },
      bearer(),
    );
    expect(response.status).toBe(400);
  });

  test('a chave interna não abre a rota de relato: 401', async () => {
    const response = await request(app)
      .post(`${base}/status/report`)
      .set('x-api-key', INTERNAL_API_KEY)
      .send(corpo);
    expect(response.status).toBe(401);
  });
});

describe('POST /status/:subSystem/check', () => {
  test('a chave interna abre a checagem', async () => {
    const response = await request(app)
      .post(`${base}/status/data-api/check`)
      .set('x-api-key', INTERNAL_API_KEY);
    expect(response.status).toBe(200);
  });

  test('usuário comum abre a checagem sem a chave', async () => {
    const response = await request(app)
      .post(`${base}/status/data-api/check`)
      .set('Authorization', bearer({ role: 'USER' }));
    expect(response.status).toBe(200);
  });

  test('sem chave nem token: 401', async () => {
    const response = await request(app).post(`${base}/status/data-api/check`);
    expect(response.status).toBe(401);
  });
});
