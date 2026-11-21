import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';

const envFalso = {
  MONITORING_API_URL: 'http://monitoring.local:3334',
  INTERNAL_API_KEY: 'chave-de-teste',
};
jest.unstable_mockModule('../src/config/env.ts', () => ({ env: envFalso }));

const { monitoringReporterService, MONITORING_PREFIX } =
  await import('../src/services/monitoringReporterService.ts');

describe('monitoringReporterService.reportStatus', () => {
  const fetchOriginal = globalThis.fetch;

  beforeEach(() => {
    envFalso.MONITORING_API_URL = 'http://monitoring.local:3334';
    envFalso.INTERNAL_API_KEY = 'chave-de-teste';
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true });
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  test('sem URL ou chave não chama o fetch', async () => {
    envFalso.MONITORING_API_URL = undefined;
    await monitoringReporterService.reportStatus('OPERATIONAL');
    envFalso.MONITORING_API_URL = 'http://monitoring.local:3334';
    envFalso.INTERNAL_API_KEY = undefined;
    await monitoringReporterService.reportStatus('OPERATIONAL');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test('envia a chave no header e o corpo esperado', async () => {
    await monitoringReporterService.reportStatus('MAINTENANCE', 'Parada');
    const [url, opcoes] = globalThis.fetch.mock.calls[0];
    expect(url).toBe(`http://monitoring.local:3334${MONITORING_PREFIX}/status`);
    expect(opcoes.method).toBe('POST');
    expect(opcoes.headers['x-api-key']).toBe('chave-de-teste');
    expect(JSON.parse(opcoes.body)).toEqual({
      subSystem: 'management',
      status: 'MAINTENANCE',
      message: 'Parada',
    });
  });

  test('timeout simulado pelo AbortController não lança erro', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.useFakeTimers();
    globalThis.fetch = jest.fn(
      (_url, opcoes) =>
        new Promise((_resolve, reject) => {
          opcoes.signal.addEventListener('abort', () =>
            reject(new Error('abortado')),
          );
        }),
    );
    const promessa = monitoringReporterService.reportStatus('OPERATIONAL');
    await jest.advanceTimersByTimeAsync(1500);
    await expect(promessa).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    jest.useRealTimers();
    spy.mockRestore();
  });
});
