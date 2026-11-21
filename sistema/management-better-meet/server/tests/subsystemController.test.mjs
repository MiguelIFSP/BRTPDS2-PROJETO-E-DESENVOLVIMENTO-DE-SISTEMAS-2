import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { AppError } from '../src/errors/AppError.ts';

jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { DATA_API_URL: 'http://dados.teste' },
}));
const pm2Service = { runAction: jest.fn() };
const dockerService = { runAction: jest.fn() };
jest.unstable_mockModule('../src/services/pm2Service.ts', () => ({
  pm2Service,
}));
jest.unstable_mockModule('../src/services/dockerService.ts', () => ({
  dockerService,
}));

const { default: subsystemRoutes } =
  await import('../src/routes/subsystemRoutes.ts');
const { sessaoService } = await import('../src/services/sessaoService.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');

const app = express();
app.use(subsystemRoutes);
app.use(handleError);

// O papel vem da API de Dados simulada, não do token.
const chamar = (nome, acao, role = 'ADMIN') => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 200,
    json: async () => ({
      id: 1,
      name: 'Ana',
      email: 'a@a.com',
      role,
      emailVerified: true,
    }),
  });
  return request(app)
    .post(`/subsystems/${nome}/${acao}`)
    .set('Authorization', `Bearer token-${role}`);
};

describe('POST /subsystems/:name/:action', () => {
  beforeEach(() => {
    sessaoService.clearCache();
    pm2Service.runAction.mockReset().mockResolvedValue(undefined);
    dockerService.runAction.mockReset().mockResolvedValue(undefined);
  });

  test('ação inválida responde 400', async () => {
    const response = await chamar('api', 'apagar');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Ação inválida. Use: start, stop ou restart.',
    );
  });

  test.each(['desconhecido', 'constructor'])(
    'subsistema %s responde 404',
    async (nome) => {
      const response = await chamar(nome, 'start');
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Subsistema desconhecido.');
    },
  );

  test.each([
    ['api', 'api'],
    ['monitoring', 'monitoring'],
  ])('%s chama o PM2 com o alvo %s', async (nome, alvo) => {
    const response = await chamar(nome, 'restart');
    expect(response.status).toBe(200);
    expect(pm2Service.runAction).toHaveBeenCalledWith(alvo, 'restart');
  });

  test.each([
    ['database', 'mysql_better_meet_dev'],
    ['monitoring-database', 'mysql_monitoring_better_meet_dev'],
  ])('%s chama o Docker com o container %s', async (nome, container) => {
    const response = await chamar(nome, 'stop');
    expect(response.status).toBe(200);
    expect(dockerService.runAction).toHaveBeenCalledWith(container, 'stop');
  });

  describe('management (a própria)', () => {
    afterEach(() => jest.useRealTimers());

    test('responde 202 e chama o PM2 depois de 100 ms', async () => {
      const response = await chamar('management', 'restart');
      expect(response.status).toBe(202);
      expect(pm2Service.runAction).not.toHaveBeenCalled();
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(pm2Service.runAction).toHaveBeenCalledWith(
        'management',
        'restart',
      );
    });
  });

  test('falha do PM2 responde 500 sem o texto do erro simulado', async () => {
    pm2Service.runAction.mockRejectedValue(
      new AppError(500, 'Não foi possível executar a ação. Tente novamente.'),
    );
    const response = await chamar('api', 'start');
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('detalhe do pm2');
  });

  test('erro inesperado do serviço não vaza a mensagem', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    dockerService.runAction.mockRejectedValue(new Error('detalhe do docker'));
    const response = await chamar('database', 'start');
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('detalhe do docker');
    spy.mockRestore();
  });

  test('sem token responde 401', async () => {
    const response = await request(app).post('/subsystems/api/start');
    expect(response.status).toBe(401);
  });

  test('usuário comum responde 403', async () => {
    const response = await chamar('api', 'start', 'USER');
    expect(response.status).toBe(403);
    expect(pm2Service.runAction).not.toHaveBeenCalled();
  });
});
