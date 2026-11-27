import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getSessionToken, setSessionToken } from '@/lib/authClient';
import { authService, getAuthErrorKind } from '@/services/authService';
import type { ApiError } from '@/utils/apiClient';

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

const sentBody = (call: number) =>
  JSON.parse(
    (mockFetch.mock.calls[call]?.[1] as RequestInit).body as string,
  ) as Record<string, unknown>;

const sentUrl = (call: number) => mockFetch.mock.calls[call]?.[0] as string;

const perfil = {
  id: 12,
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: 'USER',
  emailVerified: true,
  themePreference: 'dark',
  createdAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(async () => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as typeof fetch;
  await setSessionToken(null);
});

describe('authService.signIn', () => {
  it('entra, lê o perfil com o token novo e devolve usuário e tema', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: 'tok-1', user: {} }))
      .mockResolvedValueOnce(jsonResponse(200, perfil));

    const result = await authService.signIn('ana@exemplo.com', 'Senha123');

    expect(sentUrl(0)).toBe('http://api.teste/api/auth/sign-in/email');
    expect(sentBody(0)).toEqual({
      email: 'ana@exemplo.com',
      password: 'Senha123',
    });
    expect(sentUrl(1)).toBe('http://api.teste/api/usuarios/me');
    expect((mockFetch.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject(
      { Authorization: 'Bearer tok-1' },
    );
    expect(result.token).toBe('tok-1');
    expect(result.themePreference).toBe('dark');
    expect(result.user).toMatchObject({ id: 12, email: 'ana@exemplo.com' });
    expect(result.user).not.toHaveProperty('themePreference');
  });

  it('401 vira "E-mail ou senha incorretos." e não usa sessão anterior', async () => {
    await setSessionToken('antigo');
    mockFetch.mockResolvedValueOnce(
      jsonResponse(401, { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'x' }),
    );

    const error = await authService
      .signIn('ana@exemplo.com', 'errada')
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({
      message: 'E-mail ou senha incorretos.',
      status: 401,
    });
    expect(getAuthErrorKind(error)).toBe('invalid');
    expect(
      (mockFetch.mock.calls[0]?.[1] as RequestInit).headers,
    ).not.toHaveProperty('Authorization');
  });

  it('403 EMAIL_NOT_VERIFIED vira o tipo "unverified"', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(403, { code: 'EMAIL_NOT_VERIFIED' }),
    );
    const error = await authService
      .signIn('ana@exemplo.com', 'Senha123')
      .catch((caught: unknown) => caught);
    expect(getAuthErrorKind(error)).toBe('unverified');
    expect((error as ApiError).body).toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
    });
  });

  it('429 vira "rateLimited" e rede vira "network"', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(429, {}));
    const limited = await authService
      .signIn('a@a.com', 'x')
      .catch((caught: unknown) => caught);
    expect(getAuthErrorKind(limited)).toBe('rateLimited');
    expect((limited as Error).message).toContain('Muitas tentativas');

    mockFetch.mockRejectedValueOnce(new TypeError('rede'));
    const offline = await authService
      .signIn('a@a.com', 'x')
      .catch((caught: unknown) => caught);
    expect(getAuthErrorKind(offline)).toBe('network');
  });
});

describe('authService.signUp', () => {
  it('cadastro 200 não cria sessão e envia o callbackURL do app', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { token: null, user: {} }),
    );

    await authService.signUp({
      username: 'ana',
      email: 'ana@exemplo.com',
      password: 'Senha123',
    });

    expect(sentUrl(0)).toBe('http://api.teste/api/auth/sign-up/email');
    expect(sentBody(0)).toMatchObject({
      name: 'ana',
      username: 'ana',
      callbackURL: 'bettermeet://email-confirmado',
    });
    expect(getSessionToken()).toBeNull();
  });
});

describe('authService.requestPasswordReset', () => {
  it('200 e 404 têm o mesmo resultado (mensagem única)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { status: true }));
    await expect(
      authService.requestPasswordReset('ana@exemplo.com'),
    ).resolves.toBeUndefined();

    mockFetch.mockResolvedValueOnce(jsonResponse(404, { error: 'x' }));
    await expect(
      authService.requestPasswordReset('nao@existe.com'),
    ).resolves.toBeUndefined();
  });

  it('envia só o e-mail e o redirectTo, sem nova senha', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { status: true }));
    await authService.requestPasswordReset('ana@exemplo.com');
    expect(sentUrl(0)).toBe('http://api.teste/api/auth/request-password-reset');
    expect(sentBody(0)).toEqual({
      email: 'ana@exemplo.com',
      redirectTo: 'bettermeet://redefinir-senha',
    });
  });

  it('429 e rede continuam sendo erro', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(429, {}));
    await expect(
      authService.requestPasswordReset('a@a.com'),
    ).rejects.toMatchObject({ status: 429 });
    mockFetch.mockRejectedValueOnce(new TypeError('rede'));
    await expect(
      authService.requestPasswordReset('a@a.com'),
    ).rejects.toMatchObject({ status: 0 });
  });
});

describe('authService.resetPassword e resendVerification', () => {
  it('INVALID_TOKEN vira a mensagem de link inválido', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(400, { code: 'INVALID_TOKEN' }),
    );
    await expect(
      authService.resetPassword('velho', 'Senha123'),
    ).rejects.toMatchObject({
      message: 'Link ou código inválido ou expirado.',
      status: 400,
    });
    expect(sentBody(0)).toEqual({ token: 'velho', newPassword: 'Senha123' });
  });

  it('reenvio manda o e-mail e o callbackURL', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { status: true }));
    await authService.resendVerification('ana@exemplo.com');
    expect(sentUrl(0)).toBe(
      'http://api.teste/api/auth/send-verification-email',
    );
    expect(sentBody(0)).toEqual({
      email: 'ana@exemplo.com',
      callbackURL: 'bettermeet://email-confirmado',
    });
  });
});

// O fetch nativo reenvia o cookie de sessão sem Origin, e o Better Auth recusa
// com 403 MISSING_OR_NULL_ORIGIN; o plugin expo() da API lê este cabeçalho.
describe('authService e o cabeçalho expo-origin', () => {
  const origemExpo = { 'expo-origin': 'bettermeet://' };
  const sentHeaders = (call: number) =>
    (mockFetch.mock.calls[call]?.[1] as RequestInit).headers;

  it('signIn envia expo-origin ao Better Auth e não à API de Dados', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(200, { token: 'tok-1', user: {} }))
      .mockResolvedValueOnce(jsonResponse(200, perfil));

    await authService.signIn('ana@exemplo.com', 'Senha123');

    expect(sentHeaders(0)).toMatchObject(origemExpo);
    expect(sentUrl(1)).toBe('http://api.teste/api/usuarios/me');
    expect(sentHeaders(1)).not.toHaveProperty('expo-origin');
  });

  it.each([
    [
      'signUp',
      () =>
        authService.signUp({
          username: 'ana',
          email: 'ana@exemplo.com',
          password: 'Senha123',
        }),
    ],
    [
      'requestPasswordReset',
      () => authService.requestPasswordReset('ana@exemplo.com'),
    ],
    ['resetPassword', () => authService.resetPassword('tok', 'Senha123')],
    [
      'resendVerification',
      () => authService.resendVerification('ana@exemplo.com'),
    ],
  ])('%s envia expo-origin', async (_nome, chamar) => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { status: true }));
    await chamar();
    expect(sentHeaders(0)).toMatchObject(origemExpo);
  });

  it('signOut envia expo-origin', async () => {
    await setSessionToken('tok');
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));
    await authService.signOut();
    expect(sentHeaders(0)).toMatchObject(origemExpo);
  });
});

describe('authService.signOut', () => {
  it('chama a API com o token e apaga a sessão local', async () => {
    await setSessionToken('tok');
    mockFetch.mockResolvedValueOnce(jsonResponse(200, {}));
    await authService.signOut();
    expect(sentUrl(0)).toBe('http://api.teste/api/auth/sign-out');
    expect((mockFetch.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject(
      { Authorization: 'Bearer tok' },
    );
    expect(getSessionToken()).toBeNull();
  });

  it('apaga a sessão local mesmo se a API falhar', async () => {
    await setSessionToken('tok');
    mockFetch.mockRejectedValueOnce(new TypeError('rede'));
    await expect(authService.signOut()).resolves.toBeUndefined();
    expect(getSessionToken()).toBeNull();
  });
});
