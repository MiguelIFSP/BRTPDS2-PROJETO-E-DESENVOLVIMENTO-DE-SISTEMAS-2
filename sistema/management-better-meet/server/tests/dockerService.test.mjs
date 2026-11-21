import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const container = {
  start: jest.fn(),
  stop: jest.fn(),
  restart: jest.fn(),
};
const getContainer = jest.fn(() => container);
const construtor = jest.fn();
jest.unstable_mockModule('dockerode', () => ({
  default: class DockerFalso {
    constructor(opcoes) {
      construtor(opcoes);
      this.getContainer = getContainer;
    }
  },
}));

const { dockerService } = await import('../src/services/dockerService.ts');

describe('dockerService.runAction', () => {
  beforeEach(() => {
    for (const metodo of ['start', 'stop', 'restart']) {
      container[metodo].mockReset().mockResolvedValue(undefined);
    }
    getContainer.mockClear();
  });

  test('o socket do Docker depende da plataforma', () => {
    const { socketPath } = construtor.mock.calls[0][0];
    expect(socketPath).toBe(
      process.platform === 'win32'
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock',
    );
  });

  test.each(['start', 'stop', 'restart'])(
    '%s chama o método do container certo',
    async (action) => {
      await dockerService.runAction('mysql_x', action);
      expect(getContainer).toHaveBeenCalledWith('mysql_x');
      expect(container[action]).toHaveBeenCalledTimes(1);
    },
  );

  test('erro do Docker vira AppError 500 genérico', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    container.stop.mockRejectedValue(
      new Error('connect ENOENT /var/run/docker.sock'),
    );
    await expect(
      dockerService.runAction('mysql_x', 'stop'),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: 'Não foi possível executar a ação. Tente novamente.',
    });
    spy.mockRestore();
  });
});
