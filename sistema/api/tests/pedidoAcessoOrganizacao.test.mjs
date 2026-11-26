import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Prisma } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const prisma = {
  user: { findUnique: jest.fn() },
  organizacao: { findUnique: jest.fn(), findMany: jest.fn() },
  organizacaoMembro: { create: jest.fn() },
  pedidoAcessoOrganizacao: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({ env: {} }));
jest.unstable_mockModule(
  'better-auth/node',
  () => ({
    fromNodeHeaders: (headers) =>
      new Headers(
        Object.entries(headers).flatMap(([key, value]) => {
          if (value === undefined) return [];
          return [
            [key, Array.isArray(value) ? value.join(', ') : String(value)],
          ];
        }),
      ),
  }),
  { virtual: true },
);
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: organizacaoRoutes } =
  await import('../src/routes/organizacaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', organizacaoRoutes);
app.use(handleError);

const CRIADOR_ID = 1;
const GERENTE_ID = 2;
const MODERADOR_ID = 3;
const MEMBRO_ID = 4;
const SOLICITANTE_ID = 9;
const ADMIN_ID = 50;

const auth = (userId) => ({ Authorization: `Bearer ${tokenDe(userId)}` });
const pessoa = (userId) => ({
  id: userId,
  name: `Pessoa ${userId}`,
  email: `usuario${userId}@example.test`,
});
const duplicado = () =>
  new Prisma.PrismaClientKnownRequestError('duplicado', {
    code: 'P2002',
    clientVersion: Prisma.prismaVersion.client,
  });

let orgs;
let membros;
let pedidos;
let nextPedidoId;

const membro = (organizacaoId, userId, papel) => ({
  organizacaoId,
  userId,
  papel,
  user: pessoa(userId),
});

const apresentarPedido = (pedido) => ({
  id: pedido.id,
  organizacaoId: pedido.organizacaoId,
  userId: pedido.userId,
  status: pedido.status,
  createdAt: pedido.createdAt,
  respondidoAt: pedido.respondidoAt,
  user: pessoa(pedido.userId),
});

beforeEach(() => {
  jest.resetAllMocks();
  orgs = [
    { id: 10, nome: 'Grêmio', status: 'ACEITA' },
    { id: 11, nome: 'Atlética', status: 'ACEITA' },
    { id: 12, nome: 'Em análise', status: 'PENDENTE' },
  ];
  membros = [
    membro(10, CRIADOR_ID, 'CRIADOR'),
    membro(10, GERENTE_ID, 'GERENTE'),
    membro(10, MODERADOR_ID, 'MODERADOR'),
    membro(10, MEMBRO_ID, 'MEMBRO'),
    membro(11, CRIADOR_ID, 'CRIADOR'),
  ];
  pedidos = [];
  nextPedidoId = 1;

  prisma.user.findUnique.mockImplementation(async ({ where }) => ({
    role: where.id === ADMIN_ID ? 'ADMIN' : 'USER',
    email: `usuario${where.id}@example.test`,
  }));
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));

  prisma.organizacao.findMany.mockImplementation(async ({ where }) => {
    const userId = where.membros.none.userId;
    return orgs
      .filter(
        (org) =>
          org.status === 'ACEITA' &&
          !membros.some(
            (item) => item.organizacaoId === org.id && item.userId === userId,
          ),
      )
      .sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'))
      .map((org) => ({
        id: org.id,
        nome: org.nome,
        pedidosAcesso: pedidos
          .filter(
            (pedido) =>
              pedido.organizacaoId === org.id && pedido.userId === userId,
          )
          .map((pedido) => ({ status: pedido.status })),
      }));
  });

  prisma.organizacao.findUnique.mockImplementation(
    async ({ where, select }) => {
      const org = orgs.find((item) => item.id === where.id);
      if (!org) return null;
      const daOrg = membros.filter((item) => item.organizacaoId === org.id);
      if (select?.membros) {
        const userId = select.membros.where.userId;
        return {
          status: org.status,
          membros: daOrg
            .filter((item) => item.userId === userId)
            .map((item) => ({ userId: item.userId })),
          pedidosAcesso: pedidos
            .filter(
              (pedido) =>
                pedido.organizacaoId === org.id && pedido.userId === userId,
            )
            .map((pedido) => ({ id: pedido.id, status: pedido.status })),
        };
      }
      return { ...org, membros: daOrg };
    },
  );

  prisma.pedidoAcessoOrganizacao.create.mockImplementation(async ({ data }) => {
    if (
      pedidos.some(
        (pedido) =>
          pedido.organizacaoId === data.organizacaoId &&
          pedido.userId === data.userId,
      )
    ) {
      throw duplicado();
    }
    const pedido = {
      id: nextPedidoId,
      organizacaoId: data.organizacaoId,
      userId: data.userId,
      status: 'PENDENTE',
      createdAt: new Date(),
      respondidoAt: null,
    };
    nextPedidoId += 1;
    pedidos.push(pedido);
    return apresentarPedido(pedido);
  });

  prisma.pedidoAcessoOrganizacao.update.mockImplementation(
    async ({ where, data }) => {
      const pedido = pedidos.find((item) => item.id === where.id);
      Object.assign(pedido, data);
      return apresentarPedido(pedido);
    },
  );

  prisma.pedidoAcessoOrganizacao.findMany.mockImplementation(
    async ({ where }) =>
      pedidos
        .filter(
          (pedido) =>
            pedido.organizacaoId === where.organizacaoId &&
            pedido.status === where.status,
        )
        .sort((left, right) => left.createdAt - right.createdAt)
        .map(apresentarPedido),
  );

  prisma.pedidoAcessoOrganizacao.findUnique.mockImplementation(
    async ({ where }) => {
      const chave = where.organizacaoId_userId;
      const pedido = pedidos.find(
        (item) =>
          item.organizacaoId === chave.organizacaoId &&
          item.userId === chave.userId,
      );
      return pedido ? { id: pedido.id, status: pedido.status } : null;
    },
  );

  prisma.organizacaoMembro.create.mockImplementation(async ({ data }) => {
    if (
      membros.some(
        (item) =>
          item.organizacaoId === data.organizacaoId &&
          item.userId === data.userId,
      )
    ) {
      throw duplicado();
    }
    membros.push(membro(data.organizacaoId, data.userId, data.papel));
    return { organizacaoId: data.organizacaoId, userId: data.userId };
  });
});

describe('GET /api/organizacoes/disponiveis', () => {
  test('lista só organizações aceitas das quais a pessoa não participa', async () => {
    const response = await request(app)
      .get('/api/organizacoes/disponiveis')
      .set(auth(SOLICITANTE_ID));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 11, nome: 'Atlética', pedido: null },
      { id: 10, nome: 'Grêmio', pedido: null },
    ]);
  });

  test('quem já é membro não vê a própria organização', async () => {
    const response = await request(app)
      .get('/api/organizacoes/disponiveis')
      .set(auth(MEMBRO_ID));

    expect(response.status).toBe(200);
    expect(response.body.map((org) => org.id)).toEqual([11]);
  });
});

describe('POST /api/organizacoes/:id/pedidos', () => {
  test('cria o pedido pendente', async () => {
    const response = await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(SOLICITANTE_ID));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      organizacaoId: 10,
      userId: SOLICITANTE_ID,
      status: 'PENDENTE',
    });
  });

  test('pedido já pendente recebe 409', async () => {
    await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(SOLICITANTE_ID));
    const response = await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(SOLICITANTE_ID));

    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'Você já solicitou acesso a esta organização.',
    );
  });

  test('pedido recusado pode ser solicitado de novo', async () => {
    await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(SOLICITANTE_ID));
    await request(app)
      .patch(`/api/organizacoes/10/pedidos/${SOLICITANTE_ID}`)
      .set(auth(CRIADOR_ID))
      .send({ status: 'RECUSADO' });

    const response = await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(SOLICITANTE_ID));

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDENTE');
    expect(pedidos).toHaveLength(1);
  });

  test('membro recebe 409', async () => {
    const response = await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(MEMBRO_ID));

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Você já é membro desta organização.');
  });

  test('organização que não está aceita recebe 404', async () => {
    const response = await request(app)
      .post('/api/organizacoes/12/pedidos')
      .set(auth(SOLICITANTE_ID));

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Organização aprovada não encontrada.');
  });
});

describe('análise do pedido', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/organizacoes/10/pedidos')
      .set(auth(SOLICITANTE_ID));
  });

  test('moderador não lista nem responde (403)', async () => {
    const lista = await request(app)
      .get('/api/organizacoes/10/pedidos')
      .set(auth(MODERADOR_ID));
    expect(lista.status).toBe(403);

    const resposta = await request(app)
      .patch(`/api/organizacoes/10/pedidos/${SOLICITANTE_ID}`)
      .set(auth(MODERADOR_ID))
      .send({ status: 'ACEITO' });
    expect(resposta.status).toBe(403);
    expect(resposta.body.error).toBe(
      'Somente o criador ou o gerente pode analisar pedidos de acesso.',
    );
  });

  test('admin da plataforma que não é criador nem gerente recebe 403', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10/pedidos')
      .set(auth(ADMIN_ID));

    expect(response.status).toBe(403);
  });

  test('gerente vê o pedido pendente', async () => {
    const response = await request(app)
      .get('/api/organizacoes/10/pedidos')
      .set(auth(GERENTE_ID));

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      userId: SOLICITANTE_ID,
      status: 'PENDENTE',
      user: pessoa(SOLICITANTE_ID),
    });
  });

  test('aceitar inclui a pessoa como membro e tira a organização da lista', async () => {
    const response = await request(app)
      .patch(`/api/organizacoes/10/pedidos/${SOLICITANTE_ID}`)
      .set(auth(GERENTE_ID))
      .send({ status: 'ACEITO' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ACEITO');
    expect(membros).toContainEqual(
      expect.objectContaining({
        organizacaoId: 10,
        userId: SOLICITANTE_ID,
        papel: 'MEMBRO',
      }),
    );

    const disponiveis = await request(app)
      .get('/api/organizacoes/disponiveis')
      .set(auth(SOLICITANTE_ID));
    expect(disponiveis.body.map((org) => org.id)).toEqual([11]);
  });
});
