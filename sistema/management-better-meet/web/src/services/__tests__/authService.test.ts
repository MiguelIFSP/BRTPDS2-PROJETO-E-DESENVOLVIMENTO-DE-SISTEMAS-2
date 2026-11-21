import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { authService } from '../authService';

const mockFetch = jest.fn<typeof fetch>();
const API = 'http://api.teste';

function resposta(status: number, corpo: unknown = {}, cabecalhos: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
    headers: { get: (nome: string) => cabecalhos[nome.toLowerCase()] ?? null },
  } as unknown as Response;
}

const perfilAdmin = {
  id: 1,
  name: 'Admin',
  email: 'admin@teste.com',
  role: 'ADMIN',
  emailVerified: true,
  themePreference: 'dark',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function chamadasA(caminho: string) {
  return mockFetch.mock.calls.filter(([url]) => url === `${API}${caminho}`);
}

describe('authService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('login devolve o administrador e o token do cabeçalho set-auth-token', async () => {
    mockFetch
      .mockResolvedValueOnce(resposta(200, { token: 'do-corpo' }, { 'set-auth-token': 'token-fake' }))
      .mockResolvedValueOnce(resposta(200, perfilAdmin));

    const resultado = await authService.login('admin@teste.com', 'segredo');

    expect(resultado.token).toBe('token-fake');
    expect(resultado.user).toEqual({
      id: 1,
      name: 'Admin',
      email: 'admin@teste.com',
      role: 'ADMIN',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(resultado.themePreference).toBe('dark');
    expect(mockFetch).toHaveBeenNthCalledWith(1, `${API}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@teste.com', password: 'segredo' }),
    });
    expect(mockFetch).toHaveBeenNthCalledWith(2, `${API}/api/usuarios/me`, {
      headers: { Authorization: 'Bearer token-fake' },
    });
  });

  it('login usa o token do corpo quando não há cabeçalho', async () => {
    mockFetch
      .mockResolvedValueOnce(resposta(200, { token: 'do-corpo' }))
      .mockResolvedValueOnce(resposta(200, perfilAdmin));

    const resultado = await authService.login('admin@teste.com', 'segredo');

    expect(resultado.token).toBe('do-corpo');
  });

  it('login mapeia o 401', async () => {
    mockFetch.mockResolvedValue(resposta(401, { error: 'Invalid' }));

    await expect(authService.login('a@b.com', 'x')).rejects.toThrow('E-mail ou senha inválidos.');
  });

  it('login mapeia o 403 com a mensagem do servidor ou a padrão', async () => {
    mockFetch.mockResolvedValueOnce(resposta(403, { error: 'Confirme o e-mail.' }));
    await expect(authService.login('a@b.com', 'x')).rejects.toThrow('Confirme o e-mail.');

    mockFetch.mockResolvedValueOnce(resposta(403));
    await expect(authService.login('a@b.com', 'x')).rejects.toThrow(
      'Confirme seu e-mail para entrar. Enviamos um novo link.',
    );
  });

  it('login mapeia o 429', async () => {
    mockFetch.mockResolvedValue(resposta(429));

    await expect(authService.login('a@b.com', 'x')).rejects.toThrow(
      'Muitas tentativas. Tente novamente em instantes.',
    );
  });

  it('login recusa usuário comum e encerra a sessão aberta', async () => {
    mockFetch
      .mockResolvedValueOnce(resposta(200, {}, { 'set-auth-token': 'token-fake' }))
      .mockResolvedValueOnce(resposta(200, { ...perfilAdmin, role: 'USER' }))
      .mockResolvedValueOnce(resposta(200, { success: true }));

    await expect(authService.login('a@b.com', 'x')).rejects.toThrow(
      'Este painel é restrito a administradores.',
    );
    expect(chamadasA('/api/auth/sign-out')).toHaveLength(1);
  });

  it('login falha quando a API está fora', async () => {
    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(authService.login('a@b.com', 'x')).rejects.toThrow('Não foi possível conectar com a API.');
  });

  it('login falha quando a resposta não traz token', async () => {
    mockFetch.mockResolvedValue(resposta(200, {}));

    await expect(authService.login('a@b.com', 'x')).rejects.toThrow('Resposta inesperada do servidor.');
  });

  it('login falha quando o perfil não traz o papel', async () => {
    const semPapel: Record<string, unknown> = { ...perfilAdmin };
    delete semPapel.role;
    mockFetch
      .mockResolvedValueOnce(resposta(200, {}, { 'set-auth-token': 'token-fake' }))
      .mockResolvedValueOnce(resposta(200, semPapel))
      .mockResolvedValueOnce(resposta(200, { success: true }));

    await expect(authService.login('a@b.com', 'x')).rejects.toThrow('Resposta inesperada do servidor.');
    expect(chamadasA('/api/auth/sign-out')).toHaveLength(1);
  });

  it('logout envia o Bearer e ignora falha de rede', async () => {
    mockFetch.mockResolvedValueOnce(resposta(200, { success: true }));
    await authService.logout('token-fake');
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API}/api/auth/sign-out`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', Authorization: 'Bearer token-fake' });

    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(authService.logout('token-fake')).resolves.toBeUndefined();
  });
});
