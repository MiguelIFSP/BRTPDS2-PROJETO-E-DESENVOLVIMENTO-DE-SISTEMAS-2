import { jest } from '@jest/globals';

export const INTERNAL_API_KEY = 'chave-interna-de-teste';

const sessoes = new Map();
let contador = 0;

// Simula GET /api/usuarios/me (contrato C2) da API de Dados: o token de teste
// só existe neste mapa. Cada bearer() cria um token novo para o cache de 30 s
// do sessaoService não misturar testes.
export const sessaoFetch = jest.fn(async (url, init) => {
  const authorization = init?.headers?.Authorization ?? '';
  const perfil = sessoes.get(authorization.replace('Bearer ', ''));
  if (!String(url).endsWith('/api/usuarios/me') || !perfil) {
    return new Response(JSON.stringify({ error: 'Sessão inválida.' }), {
      status: 401,
    });
  }
  return new Response(JSON.stringify(perfil), { status: 200 });
});

export const perfilDeTeste = (claims = {}) => ({
  id: 7,
  name: 'Pessoa de Teste',
  email: 'pessoa@teste.com',
  role: 'USER',
  emailVerified: true,
  themePreference: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  ...claims,
});

export const registrarSessao = (claims) => {
  contador += 1;
  const token = `token-de-teste-${contador}`;
  sessoes.set(token, perfilDeTeste(claims));
  globalThis.fetch = sessaoFetch;
  return token;
};

export const bearer = (claims) => `Bearer ${registrarSessao(claims)}`;

export const createPrismaMock = () => ({
  subSystem: {
    upsert: jest.fn(async ({ where }) => ({ id: 1, name: where.name })),
    findUnique: jest.fn(),
    findMany: jest.fn(async () => []),
  },
  statusCheck: {
    create: jest.fn(async ({ data }) => ({ id: 10, ...data })),
    findFirst: jest.fn(async () => null),
    findMany: jest.fn(async () => []),
  },
  $queryRaw: jest.fn(async () => [{ 1: 1 }]),
});
