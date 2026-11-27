import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

// Comissão só aparece para quem está na equipe dela; o admin do sistema vê
// todas. Vale para a lista por organização, para as comissões que vêm junto
// com a organização e para o detalhe da comissão.

const prisma = {
  user: { findUnique: jest.fn() },
  organizacao: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  organizacaoMembro: { findUnique: jest.fn() },
  comissao: { findUnique: jest.fn(), findMany: jest.fn() },
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env: {} }));
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: organizacaoRoutes } =
  await import('../src/routes/organizacaoRoutes.ts');
const { default: comissaoRoutes } =
  await import('../src/routes/comissaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', organizacaoRoutes);
app.use('/api', comissaoRoutes);
app.use(handleError);

const CRIADOR_ID = 1;
const MEMBRO_ID = 3;
const ADMIN_ID = 50;

const auth = (userId) => ({ Authorization: `Bearer ${tokenDe(userId)}` });

const membro = (userId, papel) => ({
  organizacaoId: 10,
  userId,
  papel,
  user: { id: userId, name: `Pessoa ${userId}`, email: `u${userId}@x.test` },
});
const organizacao = {
  id: 10,
  nome: 'Grêmio',
  status: 'ACEITA',
  membros: [membro(CRIADOR_ID, 'CRIADOR'), membro(MEMBRO_ID, 'MEMBRO')],
  comissoes: [],
};
const comissao = {
  id: 20,
  nome: 'Eventos',
  descricao: null,
  organizacaoId: 10,
  organizacao: { id: 10, nome: 'Grêmio' },
  equipe: [
    {
      comissaoId: 20,
      userId: CRIADOR_ID,
      papel: 'ADMINISTRADOR',
      user: { id: CRIADOR_ID, name: 'Ana', email: 'u1@x.test' },
    },
  ],
};

const comissoesDe = (userId) => ({
  where: { equipe: { some: { userId } } },
});

beforeEach(() => {
  jest.resetAllMocks();
  prisma.user.findUnique.mockImplementation(async ({ where }) => ({
    role: where.id === ADMIN_ID ? 'ADMIN' : 'USER',
    email: `u${where.id}@x.test`,
  }));
  prisma.organizacao.findUnique.mockResolvedValue(organizacao);
  prisma.organizacao.findMany.mockResolvedValue([organizacao]);
  prisma.organizacao.update.mockImplementation(async ({ data }) => ({
    ...organizacao,
    ...data,
  }));
  prisma.organizacaoMembro.findUnique.mockResolvedValue({ papel: 'MEMBRO' });
  prisma.comissao.findUnique.mockResolvedValue(comissao);
  prisma.comissao.findMany.mockResolvedValue([]);
});

describe('GET /api/organizacoes/:organizacaoId/comissoes', () => {
  test('membro da organização recebe só as comissões em que está na equipe', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10/comissoes')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(200);
    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizacaoId: 10, equipe: { some: { userId: MEMBRO_ID } } },
      }),
    );
  });

  test('admin do sistema recebe todas as comissões da organização', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10/comissoes')
      .set(auth(ADMIN_ID));
    expect(response.status).toBe(200);
    expect(prisma.comissao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizacaoId: 10 } }),
    );
  });

  test('quem não é da organização continua recebendo 403', async () => {
    prisma.organizacaoMembro.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .get('/api/organizacoes/10/comissoes')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(403);
    expect(prisma.comissao.findMany).not.toHaveBeenCalled();
  });
});

describe('comissões que vêm junto com a organização', () => {
  test('GET /api/organizacoes/minhas traz só as comissões de quem pede', async () => {
    const response = await request(app)
      .get('/api/organizacoes/minhas')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(200);
    expect(prisma.organizacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          comissoes: comissoesDe(MEMBRO_ID),
        }),
      }),
    );
  });

  test('GET /api/organizacoes/:id traz só as comissões de quem pede', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(200);
    expect(prisma.organizacao.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          comissoes: comissoesDe(MEMBRO_ID),
        }),
      }),
    );
  });

  test('admin do sistema vê todas as comissões no detalhe da organização', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10')
      .set(auth(ADMIN_ID));
    expect(response.status).toBe(200);
    expect(prisma.organizacao.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({ comissoes: true }),
      }),
    );
  });

  test('PATCH /api/organizacoes/:id devolve só as comissões de quem edita', async () => {
    const response = await request(app)
      .patch('/api/organizacoes/10')
      .set(auth(CRIADOR_ID))
      .send({ nome: 'Grêmio Estudantil' });
    expect(response.status).toBe(200);
    expect(prisma.organizacao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          comissoes: comissoesDe(CRIADOR_ID),
        }),
      }),
    );
  });
});

describe('GET /api/comissoes/:id', () => {
  test('membro da organização fora da equipe recebe 403', async () => {
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Você não participa desta comissão.');
  });

  test('quem está na equipe vê o detalhe', async () => {
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(CRIADOR_ID));
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(20);
  });

  test('admin do sistema vê o detalhe sem estar na equipe', async () => {
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(ADMIN_ID));
    expect(response.status).toBe(200);
  });

  test('comissão inexistente responde 404 antes da checagem da equipe', async () => {
    prisma.comissao.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(404);
  });
});
