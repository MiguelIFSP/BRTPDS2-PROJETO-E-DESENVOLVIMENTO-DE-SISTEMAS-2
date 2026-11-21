import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const pm2Mock = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  restart: jest.fn(),
};
jest.unstable_mockModule('pm2', () => ({ default: pm2Mock }));

const { pm2Service } = await import('../src/services/pm2Service.ts');

describe('pm2Service.runAction', () => {
  beforeEach(() => {
    for (const mock of Object.values(pm2Mock)) mock.mockReset();
    pm2Mock.connect.mockImplementation((callback) => callback(null));
    for (const method of ['start', 'stop', 'restart']) {
      pm2Mock[method].mockImplementation((_nome, callback) => callback(null));
    }
  });

  test.each(['start', 'stop', 'restart'])(
    '%s chama o método certo e desconecta',
    async (action) => {
      await pm2Service.runAction('api', action);
      expect(pm2Mock[action]).toHaveBeenCalledWith('api', expect.any(Function));
      expect(pm2Mock.disconnect).toHaveBeenCalledTimes(1);
    },
  );

  test('erro do PM2 vira AppError 500 genérico', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    pm2Mock.restart.mockImplementation((_nome, callback) =>
      callback(new Error('detalhe interno do pm2')),
    );
    await expect(pm2Service.runAction('api', 'restart')).rejects.toMatchObject({
      statusCode: 500,
      message: 'Não foi possível executar a ação. Tente novamente.',
    });
    expect(pm2Mock.disconnect).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('falha ao conectar no PM2 também vira AppError 500', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    pm2Mock.connect.mockImplementation((callback) =>
      callback(new Error('sem daemon')),
    );
    await expect(pm2Service.runAction('api', 'start')).rejects.toMatchObject({
      statusCode: 500,
    });
    spy.mockRestore();
  });
});
