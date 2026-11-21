import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';

jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { DATA_API_URL: 'http://dados.teste' },
}));

const { requireAdmin, requireAuth } =
  await import('../src/middlewares/authMiddleware.ts');
const { sessaoService } = await import('../src/services/sessaoService.ts');

const TOKEN = 'token-secreto-da-sessao';
const perfil = (role, extras = {}) => ({
  id: 7,
  name: 'Ana',
  email: 'ana@exemplo.com',
  role,
  emailVerified: true,
  ...extras,
});
const resposta = (status, corpo) => ({
  status,
  json: async () => corpo,
});
const comToken = (token = TOKEN) => ({
  headers: token ? { authorization: `Bearer ${token}` } : {},
});
const executar = async (middleware, request) => {
  const next = jest.fn();
  try {
    await middleware(request, {}, next);
    return { next };
  } catch (error) {
    return { next, error };
  }
};

describe('requireAuth e requireAdmin (perfil lido da API de Dados)', () => {
  let fetchSimulado;
  let logs;

  beforeEach(() => {
    jest.useFakeTimers();
    sessaoService.clearCache();
    fetchSimulado = jest.fn();
    globalThis.fetch = fetchSimulado;
    logs = [
      jest.spyOn(console, 'error').mockImplementation(() => {}),
      jest.spyOn(console, 'info').mockImplementation(() => {}),
      jest.spyOn(console, 'log').mockImplementation(() => {}),
    ];
  });
  afterEach(() => {
    jest.useRealTimers();
    logs.forEach((spy) => spy.mockRestore());
  });

  test('sem token responde 401 sem chamar a API de Dados', async () => {
    const { error } = await executar(requireAuth, comToken(null));
    expect(error.statusCode).toBe(401);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  test('sessão válida de ADMIN preenche request.user e passa em requireAdmin', async () => {
    fetchSimulado.mockResolvedValue(resposta(200, perfil('ADMIN')));
    const request = comToken();
    const auth = await executar(requireAuth, request);
    expect(auth.error).toBeUndefined();
    expect(request.user).toEqual({
      id: 7,
      role: 'ADMIN',
      email: 'ana@exemplo.com',
    });
    const admin = await executar(requireAdmin, request);
    expect(admin.error).toBeUndefined();
    expect(admin.next).toHaveBeenCalled();
    expect(fetchSimulado).toHaveBeenCalledWith(
      'http://dados.teste/api/usuarios/me',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${TOKEN}` },
      }),
    );
  });

  test('usuário rebaixado (token ainda válido) recebe 403', async () => {
    fetchSimulado.mockResolvedValue(resposta(200, perfil('USER')));
    const request = comToken();
    expect((await executar(requireAuth, request)).error).toBeUndefined();
    expect((await executar(requireAdmin, request)).error.statusCode).toBe(403);
  });

  test('usuário excluído (API de Dados responde 401) recebe 401', async () => {
    fetchSimulado.mockResolvedValue(resposta(401, { error: 'x' }));
    const { error } = await executar(requireAuth, comToken());
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Sessão inválida. Entre novamente.');
  });

  test('rede fora responde 503 sem expor o erro', async () => {
    fetchSimulado.mockRejectedValue(new Error('ECONNREFUSED 10.0.0.1:3333'));
    const { error } = await executar(requireAuth, comToken());
    expect(error.statusCode).toBe(503);
    expect(error.message).not.toContain('ECONNREFUSED');
  });

  test('resposta 500 da API de Dados responde 503', async () => {
    fetchSimulado.mockResolvedValue(resposta(500, { error: 'falha' }));
    expect((await executar(requireAuth, comToken())).error.statusCode).toBe(
      503,
    );
  });

  test('perfil sem role responde 503', async () => {
    const { role: _role, ...semRole } = perfil('ADMIN');
    fetchSimulado.mockResolvedValue(resposta(200, semRole));
    expect((await executar(requireAuth, comToken())).error.statusCode).toBe(
      503,
    );
  });

  test('timeout de 3 s aborta a chamada e responde 503', async () => {
    fetchSimulado.mockImplementation(
      (_url, { signal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('abortado')));
        }),
    );
    const pendente = executar(requireAuth, comToken());
    await jest.advanceTimersByTimeAsync(3000);
    expect((await pendente).error.statusCode).toBe(503);
  });

  test('cache de 30 s: o rebaixamento só vale depois do prazo', async () => {
    fetchSimulado.mockResolvedValueOnce(resposta(200, perfil('ADMIN')));
    expect((await executar(requireAuth, comToken())).error).toBeUndefined();

    jest.advanceTimersByTime(10_000);
    const segunda = comToken();
    expect((await executar(requireAuth, segunda)).error).toBeUndefined();
    expect(segunda.user.role).toBe('ADMIN');
    expect(fetchSimulado).toHaveBeenCalledTimes(1);

    fetchSimulado.mockResolvedValueOnce(resposta(200, perfil('USER')));
    jest.advanceTimersByTime(21_000);
    const terceira = comToken();
    expect((await executar(requireAuth, terceira)).error).toBeUndefined();
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
    expect((await executar(requireAdmin, terceira)).error.statusCode).toBe(403);
  });

  test('401 da API de Dados não entra no cache', async () => {
    fetchSimulado.mockResolvedValue(resposta(401, {}));
    await executar(requireAuth, comToken());
    await executar(requireAuth, comToken());
    expect(fetchSimulado).toHaveBeenCalledTimes(2);
  });

  test('o token nunca aparece nos logs', async () => {
    fetchSimulado.mockRejectedValueOnce(new Error('falha'));
    await executar(requireAuth, comToken());
    fetchSimulado.mockResolvedValueOnce(resposta(500, {}));
    await executar(requireAuth, comToken());
    const impresso = JSON.stringify(logs.flatMap((spy) => spy.mock.calls));
    expect(impresso).not.toContain(TOKEN);
  });
});

describe('requireAdmin', () => {
  test('USER recebe 403', async () => {
    const { error } = await executar(requireAdmin, { user: { role: 'USER' } });
    expect(error.statusCode).toBe(403);
  });

  test('user ausente recebe 403', async () => {
    expect((await executar(requireAdmin, {})).error.statusCode).toBe(403);
  });
});
