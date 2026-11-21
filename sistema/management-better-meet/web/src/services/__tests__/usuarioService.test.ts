import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { usuarioService } from '../usuarioService';

const mockFetch = jest.fn<typeof fetch>();

describe('usuarioService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
  });

  it('updateTheme envia PATCH com Authorization e o tema', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 } as Response);

    await usuarioService.updateTheme('token-fake', 5, 'dark');

    expect(mockFetch).toHaveBeenCalledWith('http://api.teste/api/usuarios/5/tema', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-fake' },
      body: JSON.stringify({ theme: 'dark' }),
    });
  });

  it('updateTheme devolve a mensagem da API quando falha', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Tema inválido.' }),
    } as Response);

    await expect(usuarioService.updateTheme('token-fake', 5, 'dark')).rejects.toThrow(
      'Tema inválido.',
    );
  });
});
