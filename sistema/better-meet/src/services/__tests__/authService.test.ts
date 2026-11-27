import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getSessionToken, setSessionToken } from '@/lib/authClient';
import {
  authService,
  getAuthErrorKind,
  getCodeErrorKind,
} from '@/services/authService';
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
  it('cadastro 200 não cria sessão e não manda callbackURL (a API define a página)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, { token: null, user: {} }),
    );

    await authService.signUp({
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: 'Senha123',
    });

    expect(sentUrl(0)).toBe('http://api.teste/api/auth/sign-up/email');
    expect(sentBody(0)).toEqual({
      name: 'Ana',
      email: 'ana@exemplo.com',
      password: 'Senha123',
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

  it('pede o código de 6 dígitos só com o e-mail', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { success: true }));
    await authService.requestPasswordReset('ana@exemplo.com');
    expect(sentUrl(0)).toBe(
      'http://api.teste/api/auth/email-otp/request-password-reset',
    );
    expect(sentBody(0)).toEqual({ email: 'ana@exemplo.com' });
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

describe('authService.resetPassword', () => {
  it('troca a senha com e-mail, código e nova senha', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { success: true }));
    await authService.resetPassword('ana@exemplo.com', '482915', 'Senha123');
    expect(sentUrl(0)).toBe(
      'http://api.teste/api/auth/email-otp/reset-password',
    );
    expect(sentBody(0)).toEqual({
      email: 'ana@exemplo.com',
      otp: '482915',
      password: 'Senha123',
    });
  });

  it.each(['INVALID_OTP', 'OTP_EXPIRED'])(
    '%s vira "invalidCode" com a mensagem do código',
    async (code) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(400, { code }));
      const erro = await authService
        .resetPassword('ana@exemplo.com', '000000', 'Senha123')
        .catch((caught: unknown) => caught);
      expect(getCodeErrorKind(erro)).toBe('invalidCode');
      expect((erro as ApiError).message).toBe(
        'Código inválido ou expirado. Confira o e-mail ou peça um novo código.',
      );
    },
  );

  it('TOO_MANY_ATTEMPTS pede um novo código', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(403, { code: 'TOO_MANY_ATTEMPTS' }),
    );
    const erro = await authService
      .resetPassword('ana@exemplo.com', '000000', 'Senha123')
      .catch((caught: unknown) => caught);
    expect(getCodeErrorKind(erro)).toBe('tooManyAttempts');
    expect((erro as ApiError).message).toBe(
      'Muitas tentativas com este código. Peça um novo código.',
    );
  });

  it('outros erros não são erro de código', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(500, {}));
    const erro = await authService
      .resetPassword('ana@exemplo.com', '000000', 'Senha123')
      .catch((caught: unknown) => caught);
    expect(getCodeErrorKind(erro)).toBeNull();
  });
});

describe('authService.resendVerification', () => {
  it('reenvio manda só o e-mail', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { status: true }));
    await authService.resendVerification('ana@exemplo.com');
    expect(sentUrl(0)).toBe(
      'http://api.teste/api/auth/send-verification-email',
    );
    expect(sentBody(0)).toEqual({ email: 'ana@exemplo.com' });
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
          name: 'Ana',
          email: 'ana@exemplo.com',
          password: 'Senha123',
        }),
    ],
    [
      'requestPasswordReset',
      () => authService.requestPasswordReset('ana@exemplo.com'),
    ],
    [
      'resetPassword',
      () => authService.resetPassword('ana@exemplo.com', '482915', 'Senha123'),
    ],
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
