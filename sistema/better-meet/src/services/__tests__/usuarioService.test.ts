import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getSessionToken, setSessionToken } from '@/lib/authClient';
import { usuarioService } from '@/services/usuarioService';
import { useAuthStore, type AuthUser } from '@/store/authStore';

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

const user: AuthUser = {
  id: 12,
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: 'USER',
  createdAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(async () => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as typeof fetch;
  useAuthStore.getState().login(user, 'tok-antigo');
  await setSessionToken('tok-antigo');
});

describe('usuarioService', () => {
  it('getMe lê GET /usuarios/me', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        ...user,
        emailVerified: true,
        themePreference: null,
      }),
    );
    const me = await usuarioService.getMe();
    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      'http://api.teste/api/usuarios/me',
    );
    expect(me.id).toBe(12);
  });

  it('getMe com 401 lança ApiError 401', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(401, { error: 'Sessão inválida. Entre novamente.' }),
    );
    await expect(usuarioService.getMe()).rejects.toMatchObject({ status: 401 });
  });

  it('a troca de senha grava o token novo no store e na sessão', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { message: 'Senha alterada.', token: 'tok-novo' }),
    );

    await usuarioService.updatePassword(
      'tok-antigo',
      12,
      'Atual123',
      'Nova1234',
    );

    expect(useAuthStore.getState().token).toBe('tok-novo');
    expect(getSessionToken()).toBe('tok-novo');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('a troca de e-mail devolve o aviso de confirmação pendente', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { ...user, emailConfirmacaoPendente: true }),
    );
    const result = await usuarioService.updateProfile('tok-antigo', 12, {
      nome: 'Ana',
      email: 'novo@exemplo.com',
    });
    expect(result.emailConfirmacaoPendente).toBe(true);
  });

  it('o 409 da exclusão mantém o corpo com as pendências', async () => {
    const body = {
      error: 'Escolha quem vai assumir.',
      organizacoesPendentes: [{ id: 1, nome: 'Grêmio' }],
    };
    mockFetch.mockResolvedValueOnce(jsonResponse(409, body));
    await expect(
      usuarioService.deleteFullAccount('tok-antigo', 12, {}),
    ).rejects.toMatchObject({ status: 409, body });
  });
});
