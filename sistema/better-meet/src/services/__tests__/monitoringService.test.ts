import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { setSessionToken } from '@/lib/authClient';
import { monitoringService } from '@/services/monitoringService';
import { ApiError } from '@/utils/apiClient';

jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));

describe('monitoringService.reportRequestFailure', () => {
  let reportError: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    reportError = jest
      .spyOn(monitoringService, 'reportError')
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    reportError.mockRestore();
  });

  it.each([400, 401, 403, 404, 409])(
    'não reporta recusa normal da API (%i)',
    (status) => {
      monitoringService.reportRequestFailure(
        new ApiError('Recusado.', status),
        'Teste',
      );
      expect(reportError).not.toHaveBeenCalled();
    },
  );

  it.each([0, 500, 503])('reporta falha do sistema (%i)', (status) => {
    monitoringService.reportRequestFailure(
      new ApiError('Falhou.', status),
      'Teste.acao',
    );
    expect(reportError).toHaveBeenCalledWith('Falhou.', {
      context: 'Teste.acao',
      isBlocking: true,
    });
  });

  it('reporta erro inesperado que não veio da API', () => {
    monitoringService.reportRequestFailure(
      new Error('Quebrou.'),
      'Teste',
      false,
    );
    expect(reportError).toHaveBeenCalledWith('Quebrou.', {
      context: 'Teste',
      isBlocking: false,
    });
  });
});

describe('monitoringService.reportError (sessão no lugar da chave)', () => {
  const mockFetch = jest.fn<typeof fetch>();
  let now = 1_000_000;

  beforeEach(async () => {
    globalThis.fetch = mockFetch as typeof fetch;
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({}),
    } as unknown as Response);
    // passa do intervalo mínimo entre relatos a cada teste.
    now += 60_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    await setSessionToken(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sem sessão não chama a monitoring', async () => {
    await monitoringService.reportError('Falhou.');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('com sessão envia Bearer e nunca x-api-key', async () => {
    await setSessionToken('tok');
    await monitoringService.reportError('Falhou.', { context: 'Tela' });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'http://monitoring.teste/api/status/report',
    );
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(JSON.stringify(init.headers)).not.toContain('x-api-key');
    expect(JSON.parse(init.body as string)).toEqual({
      subSystem: 'mobile-app',
      status: 'ERROR',
      message: '[Tela] Falhou.',
      isBlocking: false,
    });
  });

  it('corta a mensagem em 500 caracteres', async () => {
    await setSessionToken('tok');
    await monitoringService.reportError('x'.repeat(600));
    const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(init.body as string).message).toHaveLength(500);
  });

  it('checkSubSystemNow usa o token da sessão', async () => {
    await setSessionToken('tok');
    await monitoringService.checkSubSystemNow('api');
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/status/api/check');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
  });
});
