import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';

const envFalso = {
  NODE_ENV: 'test',
  CORS_ORIGINS: [],
  TRUST_PROXY: undefined,
  RATE_LIMIT_ENABLED: false,
  DATA_API_URL: 'http://dados.teste',
  MONITORING_API_URL: undefined,
};
jest.unstable_mockModule('../src/config/env.ts', () => ({ env: envFalso }));
jest.unstable_mockModule('../src/services/pm2Service.ts', () => ({
  pm2Service: { runAction: jest.fn() },
}));
jest.unstable_mockModule('../src/services/dockerService.ts', () => ({
  dockerService: { runAction: jest.fn() },
}));

const { createApp } = await import('../src/app.ts');

describe('proteção do servidor', () => {
  beforeEach(() => {
    envFalso.CORS_ORIGINS = [];
  });

  test('helmet envia x-content-type-options: nosniff', async () => {
    const response = await request(createApp()).get('/health');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  test('/health é público', async () => {
    const response = await request(createApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('origem não listada não recebe access-control-allow-origin', async () => {
    envFalso.CORS_ORIGINS = ['http://localhost:8081'];
    const response = await request(createApp())
      .get('/health')
      .set('Origin', 'http://invasor.com');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('origem listada recebe access-control-allow-origin', async () => {
    envFalso.CORS_ORIGINS = ['http://localhost:8081'];
    const response = await request(createApp())
      .get('/health')
      .set('Origin', 'http://localhost:8081');
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:8081',
    );
  });

  test('sem CORS_ORIGINS nenhuma origem de navegador é aceita', async () => {
    const response = await request(createApp())
      .get('/health')
      .set('Origin', 'http://localhost:8081');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('corpo acima de 10 kb responde 413 em pt-BR', async () => {
    const response = await request(createApp())
      .post('/subsystems/api/restart')
      .send({ texto: 'a'.repeat(11 * 1024) });
    expect(response.status).toBe(413);
    expect(response.body.error).toBe(
      'Corpo da requisição maior que o permitido.',
    );
  });

  test('a 11ª chamada na mesma janela responde 429', async () => {
    const app = createApp({ rateLimit: true });
    for (let i = 0; i < 10; i += 1) {
      const resposta = await request(app).post('/subsystems/api/restart');
      expect(resposta.status).toBe(401);
    }
    const response = await request(app).post('/subsystems/api/restart');
    expect(response.status).toBe(429);
    expect(response.body.error).toBe(
      'Muitas tentativas. Aguarde um minuto e tente novamente.',
    );
  });

  test('rota inexistente responde 404 em JSON', async () => {
    const response = await request(createApp()).get('/nao-existe');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Rota não encontrada.' });
  });

  test('/admin/inexistente também responde 404 em JSON', async () => {
    const response = await request(createApp()).get('/admin/inexistente');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Rota não encontrada.' });
  });

  test('/admin recebe CSP próprio que permite script inline do Expo', async () => {
    const response = await request(createApp()).get('/admin/inexistente');
    expect(response.headers['content-security-policy']).toContain(
      "script-src 'self' 'unsafe-inline'",
    );
    const api = await request(createApp()).get('/health');
    expect(api.headers['content-security-policy']).toContain(
      "script-src 'self';",
    );
  });
});
