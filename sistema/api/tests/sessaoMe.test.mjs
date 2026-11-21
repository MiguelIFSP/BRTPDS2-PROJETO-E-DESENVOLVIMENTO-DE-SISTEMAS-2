import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const prisma = { user: { findUnique: jest.fn() } };
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env: {} }));
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: usuarioRoutes } =
  await import('../src/routes/usuarioRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', usuarioRoutes);
app.use(handleError);

const PERFIL = {
  id: 7,
  name: 'Ana',
  email: 'ana@example.test',
  role: 'USER',
  emailVerified: true,
  themePreference: 'system',
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
};

// o que está gravado no banco agora; null = conta excluída.
let noBanco;

beforeEach(() => {
  jest.resetAllMocks();
  noBanco = { ...PERFIL };
  prisma.user.findUnique.mockImplementation(async ({ where, select }) => {
    if (!noBanco || where.id !== noBanco.id) return null;
    return Object.fromEntries(
      Object.keys(select).map((campo) => [campo, noBanco[campo]]),
    );
  });
});

const me = (cabecalho) => {
  const chamada = request(app).get('/api/usuarios/me');
  return cabecalho ? chamada.set('Authorization', cabecalho) : chamada;
};

describe('GET /usuarios/me', () => {
  test('sessão válida devolve o perfil exato, sem senha nem token', async () => {
    const response = await me(`Bearer ${tokenDe(7)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: 7,
      name: 'Ana',
      email: 'ana@example.test',
      role: 'USER',
      emailVerified: true,
      themePreference: 'system',
      createdAt: '2026-01-02T03:04:05.000Z',
    });
    expect(JSON.stringify(response.body)).not.toMatch(/password|token/i);
  });

  test('sem credencial responde 401 "Autenticação necessária."', async () => {
    const response = await me();

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Autenticação necessária.');
  });

  test('sessão nula, vencida ou revogada responde 401 "Sessão inválida."', async () => {
    const response = await me('Bearer token-que-nao-existe');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Sessão inválida. Entre novamente.');
  });

  test('conta excluída com sessão em trânsito responde 401', async () => {
    noBanco = null;

    const response = await me(`Bearer ${tokenDe(7)}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Sessão inválida. Entre novamente.');
  });

  test('usuário rebaixado de ADMIN vê role USER na hora', async () => {
    noBanco.role = 'ADMIN';
    expect((await me(`Bearer ${tokenDe(7)}`)).body.role).toBe('ADMIN');

    noBanco.role = 'USER';
    expect((await me(`Bearer ${tokenDe(7)}`)).body.role).toBe('USER');
  });

  test('/usuarios/me não é lida como /usuarios/:id', async () => {
    const response = await me(`Bearer ${tokenDe(7)}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(7);
  });
});
