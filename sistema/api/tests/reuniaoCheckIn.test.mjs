import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { Prisma } from '@prisma/client';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const userId = 7;
const reuniaoId = 31;
const jwtSecret = 'segredo-ficticio-dos-testes-de-check-in';
const prisma = {
  reuniao: { findUnique: jest.fn(), findMany: jest.fn() },
  comissao: { findUnique: jest.fn() },
  reuniaoRegistro: {
    findUnique: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  },
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { JWT_SECRET: jwtSecret },
}));
const { default: routes } = await import('../src/routes/reuniaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const { reuniaoService } = await import('../src/services/reuniaoService.ts');
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(handleError);

const token = jwt.sign(
  { role: 'USER', email: 'integrante@example.test' },
  jwtSecret,
  {
    subject: String(userId),
    expiresIn: '1h',
  },
);
const post = (id = reuniaoId) =>
  request(app)
    .post(`/api/reunioes/${id}/entrar`)
    .set('Authorization', `Bearer ${token}`);
const postOut = (id = reuniaoId) =>
  request(app)
    .post(`/api/reunioes/${id}/sair`)
    .set('Authorization', `Bearer ${token}`);
const registro = {
  id: 12,
  reuniaoId,
  userId,
  entradaAt: new Date('2026-10-21T15:00:00.123Z'),
  saidaAt: null,
};
const duplicateError = () =>
  new Prisma.PrismaClientKnownRequestError('Presença duplicada.', {
    code: 'P2002',
    clientVersion: Prisma.prismaVersion.client,
  });

beforeEach(() => {
  jest.resetAllMocks();
  prisma.reuniao.findUnique.mockResolvedValue({
    comissaoId: 4,
    status: 'AGENDADA',
  });
  prisma.comissao.findUnique.mockResolvedValue({
    id: 4,
    organizacao: { status: 'ACEITA' },
    equipe: [{ userId }],
  });
  prisma.reuniaoRegistro.findUnique.mockResolvedValue(null);
  prisma.reuniaoRegistro.create.mockResolvedValue(registro);
  prisma.reuniaoRegistro.updateMany.mockResolvedValue({ count: 1 });
});
afterEach(() => jest.restoreAllMocks());

describe('POST /api/reunioes/:id/entrar', () => {
  test('usa o JWT e o horário do servidor, ignorando dados enviados no corpo', async () => {
    const response = await post().send({
      userId: 999,
      entradaAt: '1999-01-01',
      saidaAt: '1999-01-02',
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      jaRegistrado: false,
      registro: {
        userId,
        reuniaoId,
        entradaAt: registro.entradaAt.toISOString(),
        saidaAt: null,
      },
    });
    expect(prisma.reuniaoRegistro.create).toHaveBeenCalledWith({
      data: { reuniaoId, userId },
    });
  });

  test('repetição retorna 200 e preserva o primeiro registro', async () => {
    prisma.reuniaoRegistro.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(registro);
    const first = await post();
    const retry = await post();
    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.jaRegistrado).toBe(true);
    expect(retry.body.message).toMatch(/já/);
    expect(retry.body.registro).toEqual(first.body.registro);
    expect(prisma.reuniaoRegistro.create).toHaveBeenCalledTimes(1);
  });

  test('duas requisições simultâneas retornam o mesmo registro com 201 e 200', async () => {
    let reads = 0;
    let persisted = null;
    let release;
    const barrier = new Promise((resolve) => {
      release = resolve;
    });
    prisma.reuniaoRegistro.findUnique.mockImplementation(async () => {
      if (reads < 2) {
        reads += 1;
        if (reads === 2) release();
        await barrier;
        return null;
      }
      return persisted;
    });
    prisma.reuniaoRegistro.create.mockImplementation(async () => {
      if (persisted) throw duplicateError();
      persisted = registro;
      return registro;
    });
    const responses = await Promise.all([post(), post()]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 201]);
    expect(responses[0].body.registro).toEqual(responses[1].body.registro);
    expect(prisma.reuniaoRegistro.create).toHaveBeenCalledTimes(2);
    expect(prisma.reuniaoRegistro.findUnique).toHaveBeenCalledTimes(3);
  });

  test.each(['REALIZADA', 'CANCELADA'])(
    'preserva presença existente em reunião %s',
    async (status) => {
      prisma.reuniao.findUnique.mockResolvedValue({ comissaoId: 4, status });
      const saidaAt = new Date('2026-10-21T16:00:00.000Z');
      prisma.reuniaoRegistro.findUnique.mockResolvedValue({
        ...registro,
        saidaAt,
      });
      const response = await post();
      expect(response.status).toBe(200);
      expect(response.body.registro).toMatchObject({
        entradaAt: registro.entradaAt.toISOString(),
        saidaAt: saidaAt.toISOString(),
      });
      expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
    },
  );

  test.each(['REALIZADA', 'CANCELADA'])(
    'recusa primeira entrada em reunião %s',
    async (status) => {
      prisma.reuniao.findUnique.mockResolvedValue({ comissaoId: 4, status });
      expect((await post()).status).toBe(409);
      expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
    },
  );

  test('exige autenticação antes de consultar o banco', async () => {
    expect((await request(app).post('/api/reunioes/31/entrar')).status).toBe(
      401,
    );
    expect(prisma.reuniao.findUnique).not.toHaveBeenCalled();
  });

  test('recusa JWT inválido', async () => {
    const response = await request(app)
      .post('/api/reunioes/31/entrar')
      .set('Authorization', 'Bearer invalido');
    expect(response.status).toBe(401);
    expect(prisma.reuniao.findUnique).not.toHaveBeenCalled();
  });

  test.each(['abc', '0', '-1', '1.5'])('recusa id inválido %s', async (id) => {
    expect((await post(id)).status).toBe(400);
    expect(prisma.reuniao.findUnique).not.toHaveBeenCalled();
  });

  test('retorna 404 para reunião inexistente', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
    expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
  });

  test('recusa não integrante mesmo se houver presença anterior', async () => {
    prisma.comissao.findUnique.mockResolvedValue({
      id: 4,
      organizacao: { status: 'ACEITA' },
      equipe: [],
    });
    prisma.reuniaoRegistro.findUnique.mockResolvedValue(registro);
    expect((await post()).status).toBe(403);
    expect(prisma.reuniaoRegistro.findUnique).not.toHaveBeenCalled();
    expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
  });

  test('exige organização aprovada', async () => {
    prisma.comissao.findUnique.mockResolvedValue({
      id: 4,
      organizacao: { status: 'PENDENTE' },
      equipe: [{ userId }],
    });
    expect((await post()).status).toBe(409);
    expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
  });

  test('não confirma presença quando a gravação falha', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    prisma.reuniaoRegistro.create.mockRejectedValue(
      new Error('Detalhe interno.'),
    );
    const response = await post();
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Erro interno. Tente novamente mais tarde.',
    });
  });

  test('relança P2002 quando não há registro recuperável', async () => {
    const error = duplicateError();
    prisma.reuniaoRegistro.create.mockRejectedValue(error);
    await expect(reuniaoService.checkIn(userId, reuniaoId)).rejects.toBe(error);
  });
});

describe('POST /api/reunioes/:id/sair', () => {
  test('usa o JWT e horário do servidor sem alterar a entrada', async () => {
    const saidaAt = new Date('2026-10-21T16:00:00.000Z');
    prisma.reuniaoRegistro.findUnique
      .mockResolvedValueOnce(registro)
      .mockResolvedValueOnce({ ...registro, saidaAt });
    prisma.reuniaoRegistro.updateMany.mockImplementation(async ({ data }) => {
      expect(data.saidaAt).toBeInstanceOf(Date);
      expect(data.saidaAt).not.toEqual(new Date('1999-01-02'));
      return { count: 1 };
    });

    const response = await postOut().send({
      userId: 999,
      entradaAt: '1999-01-01',
      saidaAt: '1999-01-02',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      jaRegistrado: false,
      registro: {
        userId,
        reuniaoId,
        entradaAt: registro.entradaAt.toISOString(),
        saidaAt: saidaAt.toISOString(),
      },
    });
    expect(prisma.reuniaoRegistro.updateMany).toHaveBeenCalledWith({
      where: { reuniaoId, userId, saidaAt: null },
      data: { saidaAt: expect.any(Date) },
    });
  });

  test('repetição mantém o primeiro horário de saída', async () => {
    const saidaAt = new Date('2026-10-21T16:00:00.000Z');
    prisma.reuniaoRegistro.findUnique.mockResolvedValue({ ...registro, saidaAt });

    const response = await postOut();

    expect(response.status).toBe(200);
    expect(response.body.jaRegistrado).toBe(true);
    expect(response.body.registro).toMatchObject({
      entradaAt: registro.entradaAt.toISOString(),
      saidaAt: saidaAt.toISOString(),
    });
    expect(prisma.reuniaoRegistro.updateMany).not.toHaveBeenCalled();
  });

  test('não permite saída sem entrada registrada', async () => {
    expect((await postOut()).status).toBe(409);
    expect(prisma.reuniaoRegistro.updateMany).not.toHaveBeenCalled();
  });
});

describe('presença ao recarregar reuniões', () => {
  test('busca apenas o registro do usuário autenticado e omite a relação interna', async () => {
    prisma.reuniao.findMany.mockResolvedValue([
      { id: reuniaoId, registros: [registro] },
      { id: 32, registros: [] },
    ]);
    const result = await reuniaoService.listMine(userId);
    expect(prisma.reuniao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({ registros: { where: { userId } } }),
      }),
    );
    expect(result).toEqual([
      { id: reuniaoId, meuRegistro: registro },
      { id: 32, meuRegistro: null },
    ]);
  });
});
