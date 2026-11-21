import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import {
  requireAdmin,
  requireAuth,
  requireAuthOrApiKey,
} from '../src/middlewares/authMiddleware.ts';
import { INTERNAL_API_KEY, perfilDeTeste } from './helpers.mjs';

const fakeRequest = (headers = {}) => ({
  headers,
  header: (name) => headers[name.toLowerCase()],
});

const resposta = (status, corpo) =>
  new Response(JSON.stringify(corpo ?? {}), { status });

const fetchMock = jest.fn();
let contador = 0;
// Cada teste usa um token novo para o cache de 30 s não vazar entre eles.
const novoToken = () => `sessao-${(contador += 1)}`;
const comToken = (token) => ({ authorization: `Bearer ${token}` });

const run = async (middleware, headers) => {
  const request = fakeRequest(headers);
  const next = jest.fn();
  let error;
  try {
    await middleware(request, {}, next);
  } catch (caught) {
    error = caught;
  }
  return { request, next, error };
};

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('requireAuth', () => {
  test('sem token: 401 e não chama a API de Dados', async () => {
    const { error, next } = await run(requireAuth, {});
    expect(error).toMatchObject({
      statusCode: 401,
      message: 'Autenticação necessária.',
    });
    expect(next).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('sessão válida preenche request.user com o role do corpo da C2', async () => {
    fetchMock.mockResolvedValue(
      resposta(200, perfilDeTeste({ id: 42, role: 'ADMIN', email: 'x@x.com' })),
    );
    const token = novoToken();
    const { request, next, error } = await run(requireAuth, comToken(token));
    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalled();
    expect(request.user).toEqual({ id: 42, role: 'ADMIN', email: 'x@x.com' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.teste/api/usuarios/me');
    expect(init.headers.Authorization).toBe(`Bearer ${token}`);
  });

  test('401 da API de Dados vira 401', async () => {
    fetchMock.mockResolvedValue(resposta(401, { error: 'Sessão inválida.' }));
    const { error, next } = await run(requireAuth, comToken(novoToken()));
    expect(error).toMatchObject({
      statusCode: 401,
      message: 'Sessão inválida. Entre novamente.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('usuário excluído (401 da C2) volta a 401 depois do TTL', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-21T12:00:00Z') });
    const headers = comToken(novoToken());
    fetchMock.mockResolvedValueOnce(resposta(200, perfilDeTeste()));
    await run(requireAuth, headers);
    jest.setSystemTime(new Date('2026-11-21T12:00:31Z'));
    fetchMock.mockResolvedValueOnce(resposta(401));
    const { error } = await run(requireAuth, headers);
    expect(error).toMatchObject({ statusCode: 401 });
  });

  test('API de Dados fora do ar: 503 sem expor o erro', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED 10.0.0.5:3333'));
    const { error, next } = await run(requireAuth, comToken(novoToken()));
    expect(error).toMatchObject({
      statusCode: 503,
      message: 'Não foi possível validar a sessão agora. Tente novamente.',
    });
    expect(error.message).not.toContain('ECONNREFUSED');
    expect(next).not.toHaveBeenCalled();
  });

  test('resposta 500 da API de Dados: 503', async () => {
    fetchMock.mockResolvedValue(resposta(500, { error: 'Erro interno.' }));
    const { error } = await run(requireAuth, comToken(novoToken()));
    expect(error).toMatchObject({ statusCode: 503 });
  });

  test('corpo da C2 sem role: 503, nunca acesso liberado', async () => {
    const { role: _role, ...semRole } = perfilDeTeste();
    fetchMock.mockResolvedValue(resposta(200, semRole));
    const { error, next } = await run(requireAuth, comToken(novoToken()));
    expect(error).toMatchObject({ statusCode: 503 });
    expect(next).not.toHaveBeenCalled();
  });

  test('segundo uso dentro de 30 s usa o cache; depois de 31 s consulta de novo', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-21T12:00:00Z') });
    fetchMock.mockImplementation(async () => resposta(200, perfilDeTeste()));
    const headers = comToken(novoToken());

    await run(requireAuth, headers);
    jest.setSystemTime(new Date('2026-11-21T12:00:29Z'));
    await run(requireAuth, headers);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    jest.setSystemTime(new Date('2026-11-21T12:00:31Z'));
    await run(requireAuth, headers);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('rebaixamento de ADMIN para USER vale depois do TTL', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-21T12:00:00Z') });
    const headers = comToken(novoToken());
    fetchMock.mockResolvedValueOnce(
      resposta(200, perfilDeTeste({ role: 'ADMIN' })),
    );
    const antes = await run(requireAuth, headers);
    expect(antes.request.user.role).toBe('ADMIN');

    jest.setSystemTime(new Date('2026-11-21T12:00:31Z'));
    fetchMock.mockResolvedValueOnce(
      resposta(200, perfilDeTeste({ role: 'USER' })),
    );
    const depois = await run(requireAuth, headers);
    expect(depois.request.user.role).toBe('USER');
  });

  test('o token nunca aparece nos logs', async () => {
    const token = novoToken();
    fetchMock.mockRejectedValueOnce(new Error('falha de rede'));
    await run(requireAuth, comToken(token));
    fetchMock.mockResolvedValueOnce(resposta(500));
    await run(requireAuth, comToken(novoToken()));
    const logs = JSON.stringify(console.error.mock.calls);
    expect(logs).not.toContain(token);
    expect(logs).not.toContain('sessao-');
  });
});

describe('requireAuthOrApiKey', () => {
  test('aceita a chave interna sem consultar a API de Dados', async () => {
    const { next, error } = await run(requireAuthOrApiKey, {
      'x-api-key': INTERNAL_API_KEY,
    });
    expect(error).toBeUndefined();
    expect(next).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('chave errada sem token: 401', async () => {
    const { error } = await run(requireAuthOrApiKey, {
      'x-api-key': 'errada',
    });
    expect(error).toMatchObject({ statusCode: 401 });
  });

  test('aceita sessão sem a chave', async () => {
    fetchMock.mockResolvedValue(resposta(200, perfilDeTeste()));
    const { next } = await run(requireAuthOrApiKey, comToken(novoToken()));
    expect(next).toHaveBeenCalled();
  });
});

describe('requireAdmin', () => {
  test('USER recebe 403 e ADMIN passa', () => {
    const comum = { user: { role: 'USER' } };
    expect(() => requireAdmin(comum, {}, jest.fn())).toThrow(
      'Acesso restrito ao administrador.',
    );
    const next = jest.fn();
    requireAdmin({ user: { role: 'ADMIN' } }, {}, next);
    expect(next).toHaveBeenCalled();
  });
});
