import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ApiError, NETWORK_ERROR_MESSAGE, apiRequest } from '@/utils/apiClient';

const mockFetch = jest.fn<typeof fetch>();

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
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
      baseUrl: 'http://monitoring.teste/monitoring-better-meet',
      fallbackError: 'Falhou.',
    });

    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      'http://monitoring.teste/monitoring-better-meet/status',
    );
  });
});
