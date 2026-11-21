import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { setSessionToken } from '@/lib/authClient';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import { ApiError, NETWORK_ERROR_MESSAGE, apiRequest } from '@/utils/apiClient';

jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));

const mockFetch = jest.fn<typeof fetch>();

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as typeof fetch;
});

describe('apiRequest', () => {
  it('monta a URL a partir de API_URL e envia token e corpo em JSON', async () => {
    mockFetch.mockResolvedValue(jsonResponse(201, { id: 1 }));

    const data = await apiRequest<{ id: number }>('/organizacoes', {
      method: 'POST',
      token: 'abc',
      body: { nome: 'Grêmio' },
      fallbackError: 'Falhou.',
    });

    expect(data).toEqual({ id: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://api.teste/api/organizacoes',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer abc',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome: 'Grêmio' }),
      },
    );
  });

  it('não envia Content-Type nem corpo quando não há body', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    await apiRequest('/organizacoes/minhas', { fallbackError: 'Falhou.' });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://api.teste/api/organizacoes/minhas',
      { method: 'GET', headers: {}, body: undefined },
    );
  });

  it('usa a mensagem de erro da API e guarda o status', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(409, { error: 'Este e-mail já está cadastrado.' }),
    );

    const request = apiRequest('/usuarios', { fallbackError: 'Falhou.' });

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      message: 'Este e-mail já está cadastrado.',
      status: 409,
    });
  });

  it('usa a mensagem padrão quando a resposta de erro não é JSON', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError('HTML')),
    } as unknown as Response);

    await expect(
      apiRequest('/usuarios', { fallbackError: 'Falhou.' }),
    ).rejects.toMatchObject({ message: 'Falhou.', status: 500 });
  });

  it('sem conexão, lança status 0 com a mensagem de rede', async () => {
    mockFetch.mockRejectedValue(new TypeError('Network request failed'));

    await expect(
      apiRequest('/usuarios', { fallbackError: 'Falhou.' }),
    ).rejects.toMatchObject({ message: NETWORK_ERROR_MESSAGE, status: 0 });
  });

  it('aceita outra URL base (monitoring)', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    await apiRequest('/status', {
      baseUrl: 'http://monitoring.teste/api',
      fallbackError: 'Falhou.',
    });

    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      'http://monitoring.teste/api/status',
    );
  });
});

describe('apiRequest e a sessão (401)', () => {
  const user: AuthUser = {
    id: 1,
    name: 'Ana',
    email: 'ana@exemplo.com',
    role: 'USER',
    createdAt: '2026-10-01T00:00:00.000Z',
  };
  const unauthorized = () =>
    mockFetch.mockResolvedValue(
      jsonResponse(401, { error: 'Sessão inválida.' }),
    );

  beforeEach(async () => {
    useAuthStore.getState().login(user, 'tok');
    await setSessionToken('tok');
    useAuthStore.setState({ sessionExpired: false });
  });

  it('401 com token encerra a sessão e liga o aviso', async () => {
    unauthorized();
    await expect(
      apiRequest('/x', { token: 'tok', fallbackError: 'Falhou.' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().sessionExpired).toBe(true);
  });

  it('sem token passado usa o da sessão em memória', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, {}));
    await apiRequest('/x', { fallbackError: 'Falhou.' });
    const init = mockFetch.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
  });

  it('401 sem credencial (login errado) não encerra a sessão', async () => {
    await setSessionToken(null);
    unauthorized();
    await expect(
      apiRequest('/x', { fallbackError: 'Falhou.' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('expireSessionOn401: false e outra baseUrl não encerram a sessão', async () => {
    unauthorized();
    await expect(
      apiRequest('/x', { expireSessionOn401: false, fallbackError: 'Falhou.' }),
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      apiRequest('/x', {
        baseUrl: 'http://monitoring.teste/api',
        fallbackError: 'Falhou.',
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('500 e falta de rede não encerram a sessão', async () => {
    mockFetch.mockResolvedValue(jsonResponse(500, {}));
    await expect(
      apiRequest('/x', { fallbackError: 'Falhou.' }),
    ).rejects.toBeInstanceOf(ApiError);
    mockFetch.mockRejectedValue(new TypeError('rede'));
    await expect(
      apiRequest('/x', { fallbackError: 'Falhou.' }),
    ).rejects.toMatchObject({ status: 0 });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('uma rajada de três 401 encerra a sessão uma vez só', async () => {
    unauthorized();
    const results = await Promise.allSettled([
      apiRequest('/a', { fallbackError: 'F.' }),
      apiRequest('/b', { fallbackError: 'F.' }),
      apiRequest('/c', { fallbackError: 'F.' }),
    ]);
    expect(results.every((item) => item.status === 'rejected')).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().sessionExpired).toBe(true);
  });
});
