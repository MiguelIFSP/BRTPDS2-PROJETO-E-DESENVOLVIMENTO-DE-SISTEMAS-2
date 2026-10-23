import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const jwtSecret = 'segredo-ficticio-dos-testes-de-detalhe';
const prisma = {
  organizacao: { findUnique: jest.fn(), update: jest.fn() },
  organizacaoMembro: { findUnique: jest.fn() },
  comissao: { findUnique: jest.fn(), update: jest.fn() },
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { JWT_SECRET: jwtSecret },
}));
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
const GERENTE_ID = 2;
const MEMBRO_ID = 3;
const FORA_ID = 9;
const ADMIN_ID = 50;

const tokenFor = (userId, role = 'USER') =>
  jwt.sign({ role, email: `usuario${userId}@example.test` }, jwtSecret, {
    subject: String(userId),
    expiresIn: '1h',
  });
const auth = (userId, role) => ({
  Authorization: `Bearer ${tokenFor(userId, role)}`,
});

const membro = (userId, papel, name) => ({
  organizacaoId: 10,
  userId,
  papel,
  user: { id: userId, name, email: `usuario${userId}@example.test` },
});
const organizacao = {
  id: 10,
  nome: 'Grêmio',
  status: 'ACEITA',
  membros: [
    membro(MEMBRO_ID, 'MEMBRO', 'Carla'),
    membro(CRIADOR_ID, 'CRIADOR', 'Ana'),
    membro(GERENTE_ID, 'GERENTE', 'Bruno'),
  ],
  comissoes: [],
};

const equipe = (userId, papel, name) => ({
  comissaoId: 20,
  userId,
  papel,
  user: { id: userId, name, email: `usuario${userId}@example.test` },
});
const comissao = {
  id: 20,
  nome: 'Eventos',
  descricao: null,
  organizacaoId: 10,
  organizacao: { id: 10, nome: 'Grêmio' },
  equipe: [
    equipe(MEMBRO_ID, 'MEMBRO', 'Carla'),
    equipe(GERENTE_ID, 'FACILITADOR', 'Bruno'),
    equipe(CRIADOR_ID, 'ADMINISTRADOR', 'Ana'),
  ],
};
// formato do select usado para descobrir o papel de quem age na comissão.
const papelNaComissao = (papel) => ({
  organizacaoId: 10,
  equipe: papel ? [{ papel }] : [],
});

beforeEach(() => {
  jest.resetAllMocks();
  prisma.organizacao.findUnique.mockResolvedValue(organizacao);
  prisma.organizacao.update.mockImplementation(async ({ data }) => ({
    ...organizacao,
    ...data,
  }));
  prisma.comissao.findUnique.mockResolvedValue(comissao);
  prisma.comissao.update.mockImplementation(async ({ data }) => ({
    ...comissao,
    ...data,
  }));
});

describe('GET /api/organizacoes/:id', () => {
  test('membro vê o detalhe, com os membros ordenados por papel', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(200);
    expect(response.body.membros.map((item) => item.papel)).toEqual([
      'CRIADOR',
      'GERENTE',
      'MEMBRO',
    ]);
  });

  test('quem não é membro recebe 403', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10')
      .set(auth(FORA_ID));
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Você não é membro desta organização.');
  });

  test('admin da plataforma vê o detalhe sem ser membro', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10')
      .set(auth(ADMIN_ID, 'ADMIN'));
    expect(response.status).toBe(200);
  });

  test('organização inexistente responde 404', async () => {
    prisma.organizacao.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .get('/api/organizacoes/10')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(404);
  });

  test('id malformado responde 400 antes de consultar o banco', async () => {
    const response = await request(app)
      .get('/api/organizacoes/abc')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(400);
    expect(prisma.organizacao.findUnique).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/organizacoes/:id', () => {
  test.each([
    ['criador', CRIADOR_ID, 'USER'],
    ['gerente', GERENTE_ID, 'USER'],
    ['admin da plataforma', ADMIN_ID, 'ADMIN'],
  ])('%s renomeia a organização', async (_quem, userId, role) => {
    const response = await request(app)
      .patch('/api/organizacoes/10')
      .set(auth(userId, role))
      .send({ nome: '  Grêmio Estudantil  ' });
    expect(response.status).toBe(200);
    expect(response.body.nome).toBe('Grêmio Estudantil');
    expect(prisma.organizacao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 10 },
        data: { nome: 'Grêmio Estudantil' },
      }),
    );
  });

  test.each([
    ['membro comum', MEMBRO_ID],
    ['quem não é membro', FORA_ID],
  ])('%s recebe 403 e nada é gravado', async (_quem, userId) => {
    const response = await request(app)
      .patch('/api/organizacoes/10')
      .set(auth(userId))
      .send({ nome: 'Outro nome' });
    expect(response.status).toBe(403);
    expect(prisma.organizacao.update).not.toHaveBeenCalled();
  });

  test('nome vazio responde 400', async () => {
    const response = await request(app)
      .patch('/api/organizacoes/10')
      .set(auth(CRIADOR_ID))
      .send({ nome: '   ' });
    expect(response.status).toBe(400);
    expect(prisma.organizacao.update).not.toHaveBeenCalled();
  });
});

describe('GET /api/comissoes/:id', () => {
  test('membro da organização vê a equipe ordenada por papel', async () => {
    prisma.organizacaoMembro.findUnique.mockResolvedValue({
      papel: 'MEMBRO',
    });
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(200);
    expect(response.body.equipe.map((item) => item.papel)).toEqual([
      'ADMINISTRADOR',
      'FACILITADOR',
      'MEMBRO',
    ]);
  });

  test('quem não é membro da organização recebe 403', async () => {
    prisma.organizacaoMembro.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(FORA_ID));
    expect(response.status).toBe(403);
  });

  test('admin da plataforma vê sem consultar a participação', async () => {
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(ADMIN_ID, 'ADMIN'));
    expect(response.status).toBe(200);
    expect(prisma.organizacaoMembro.findUnique).not.toHaveBeenCalled();
  });

  test('comissão inexistente responde 404', async () => {
    prisma.comissao.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .get('/api/comissoes/20')
      .set(auth(MEMBRO_ID));
    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/comissoes/:id', () => {
  test.each(['ADMINISTRADOR', 'FACILITADOR'])(
    '%s altera nome e descrição',
    async (papel) => {
      prisma.comissao.findUnique.mockResolvedValue(papelNaComissao(papel));
      const response = await request(app)
        .patch('/api/comissoes/20')
        .set(auth(GERENTE_ID))
        .send({ nome: ' Eventos 2027 ', descricao: '', organizacaoId: 99 });
      expect(response.status).toBe(200);
      // a comissão não muda de organização, e descrição vazia vira null.
      expect(prisma.comissao.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { nome: 'Eventos 2027', descricao: null },
      });
    },
  );

  test.each([
    ['SECRETARIO', 'SECRETARIO'],
    ['MEMBRO', 'MEMBRO'],
    ['quem não está na equipe', undefined],
  ])('%s recebe 403 e nada é gravado', async (_quem, papel) => {
    prisma.comissao.findUnique.mockResolvedValue(papelNaComissao(papel));
    const response = await request(app)
      .patch('/api/comissoes/20')
      .set(auth(MEMBRO_ID))
      .send({ nome: 'Outro nome' });
    expect(response.status).toBe(403);
    expect(prisma.comissao.update).not.toHaveBeenCalled();
  });

  test('comissão inexistente responde 404', async () => {
    prisma.comissao.findUnique.mockResolvedValue(null);
    const response = await request(app)
      .patch('/api/comissoes/20')
      .set(auth(CRIADOR_ID))
      .send({ nome: 'Outro nome' });
    expect(response.status).toBe(404);
  });
});
