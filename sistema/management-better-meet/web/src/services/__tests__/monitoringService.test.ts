import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  SessaoExpiradaError,
  checkSubSystemNow,
  getCurrentStatus,
  getSubSystemHistory,
  reportManagementError,
} from '../monitoringService';
import { useAuthStore } from '../../store/authStore';

const mockFetch = jest.fn<typeof fetch>();
const BASE = 'http://monitoring.teste/api';

function resposta(status: number, corpo: unknown = {}): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => corpo } as Response;
}

// Acumula entre os testes: o intervalo mínimo é estado do módulo e persiste.
let relogio = 0;

describe('monitoringService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  it('getCurrentStatus envia o Bearer para a rota de status', async () => {
    mockFetch.mockResolvedValue(resposta(200, []));

    await getCurrentStatus('token-fake');

    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/status`, {
      headers: { Authorization: 'Bearer token-fake' },
    });
  });

  it('getCurrentStatus lança SessaoExpiradaError no 401', async () => {
    mockFetch.mockResolvedValue(resposta(401));

    await expect(getCurrentStatus('token-fake')).rejects.toBeInstanceOf(SessaoExpiradaError);
  });

  it('getCurrentStatus lança a mensagem padrão no 500', async () => {
    mockFetch.mockResolvedValue(resposta(500));

    await expect(getCurrentStatus('token-fake')).rejects.toThrow(
      'Não foi possível carregar o status atual.',
    );
  });

  it('getSubSystemHistory monta a query com os dias', async () => {
    mockFetch.mockResolvedValue(resposta(200, { history: [] }));

    await getSubSystemHistory(7, 30, 'token-fake');

    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/status/7/history?days=30`, {
      headers: { Authorization: 'Bearer token-fake' },
    });
  });

  it('checkSubSystemNow envia o Bearer e devolve o JSON', async () => {
    const status = { id: 1, subSystem: 'monitoring', status: 'OPERATIONAL' };
    mockFetch.mockResolvedValue(resposta(200, status));

    const resultado = await checkSubSystemNow('monitoring', 'token-fake');

    expect(resultado).toEqual(status);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/status/monitoring/check`, {
      method: 'POST',
      headers: { Authorization: 'Bearer token-fake' },
    });
  });

  describe('reportManagementError', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Avança além do intervalo mínimo deixado pelo teste anterior.
      relogio += 60_000;
      jest.setSystemTime(Date.now() + relogio);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      useAuthStore.getState().login(
        { id: 1, name: 'Admin', email: 'admin@teste.com', role: 'ADMIN', createdAt: '2026-01-01' },
        'token-fake',
      );
    });

    afterEach(() => {
      useAuthStore.getState().logout();
      jest.restoreAllMocks();
      jest.useRealTimers();
    });

    it('envia o Bearer para status/report e não envia x-api-key', async () => {
      mockFetch.mockResolvedValue(resposta(201));

      await reportManagementError('falha', undefined, { context: 'Tela', isBlocking: true });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${BASE}/status/report`);
      expect(init.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-fake',
      });
      expect(JSON.parse(init.body as string)).toEqual({
        subSystem: 'management',
        status: 'ERROR',
        message: '[Tela] falha',
        isBlocking: true,
      });
    });

    it('não chama o fetch sem sessão', async () => {
      useAuthStore.getState().logout();

      await reportManagementError('falha');

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('não entra em laço quando a rota responde 401', async () => {
      mockFetch.mockResolvedValue(resposta(401));

      await expect(reportManagementError('falha')).resolves.toBeUndefined();
      await reportManagementError('falha de novo');

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('respeita o intervalo mínimo de 5 segundos', async () => {
      mockFetch.mockResolvedValue(resposta(201));

      await reportManagementError('falha 1');
      await reportManagementError('falha 2');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      jest.setSystemTime(Date.now() + 5001);
      await reportManagementError('falha 3');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('não relança erro de rede', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(reportManagementError('falha')).resolves.toBeUndefined();
    });
  });
});
