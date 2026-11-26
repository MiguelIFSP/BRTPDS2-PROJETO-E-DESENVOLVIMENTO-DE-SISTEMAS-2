import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const prisma = {
  user: { findUnique: jest.fn() },
  organizacao: { findUnique: jest.fn() },
  organizacaoMembro: { delete: jest.fn() },
  comissao: { findUnique: jest.fn(), deleteMany: jest.fn() },
  comissaoEquipe: {
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  conviteReuniao: { findMany: jest.fn(), deleteMany: jest.fn() },
  reuniao: { findUnique: jest.fn() },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { TZ_REUNIOES: 'America/Sao_Paulo' },
}));
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: routes } = await import('../src/routes/organizacaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const { reuniaoService } = await import('../src/services/reuniaoService.ts');
const { ataService } = await import('../src/services/ataService.ts');
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(handleError);

const ORGANIZACAO_ID = 10;
const CRIADOR_ID = 1;
const ALVO_ID = 3;
const OUTRO_ID = 4;

const remover = (idAlvo = ALVO_ID, corpo) => {
  const chamada = request(app)
    .delete(`/api/organizacoes/${ORGANIZACAO_ID}/membros/${idAlvo}`)
    .set('Authorization', `Bearer ${tokenDe(CRIADOR_ID)}`);
  return corpo ? chamada.send(corpo) : chamada;
};

const membros = () => [
  { organizacaoId: ORGANIZACAO_ID, userId: CRIADOR_ID, papel: 'CRIADOR' },
  { organizacaoId: ORGANIZACAO_ID, userId: ALVO_ID, papel: 'MEMBRO' },
];

const pessoa = (id) => ({
  id,
  name: `Pessoa ${id}`,
  email: `pessoa${id}@example.test`,
});
const vinculo = (comissaoId, equipe) => ({
  comissaoId,
  userId: ALVO_ID,
  papel: equipe.find((m) => m.userId === ALVO_ID).papel,
  comissao: {
    id: comissaoId,
    nome: `Comissão ${comissaoId}`,
    organizacaoId: ORGANIZACAO_ID,
    equipe: equipe.map((m) => ({ ...m, user: pessoa(m.userId) })),
  },
});

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$queryRaw.mockResolvedValue([{ id: 31 }]);
  prisma.user.findUnique.mockImplementation(async ({ where }) => ({
    role: 'USER',
    email: `usuario${where.id}@example.test`,
  }));
  prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
  prisma.organizacao.findUnique.mockResolvedValue({
    id: ORGANIZACAO_ID,
    membros: membros(),
  });
  prisma.comissaoEquipe.findMany.mockResolvedValue([]);
  prisma.conviteReuniao.findMany.mockResolvedValue([]);
});

describe('DELETE /api/organizacoes/:id/membros/:userId', () => {
  test('remove da equipe das comissões e da organização na mesma transação', async () => {
    prisma.comissaoEquipe.findMany.mockResolvedValue([
      vinculo(7, [
        { userId: ALVO_ID, papel: 'MEMBRO' },
        { userId: OUTRO_ID, papel: 'ADMINISTRADOR' },
      ]),
    ]);

    const response = await remover();

    expect(response.status).toBe(200);
    expect(response.body.comissoesApagadas).toEqual([]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.comissaoEquipe.deleteMany).toHaveBeenCalledWith({
      where: { userId: ALVO_ID, comissaoId: { in: [7] } },
    });
    expect(prisma.organizacaoMembro.delete).toHaveBeenCalledWith({
      where: {
        organizacaoId_userId: {
          organizacaoId: ORGANIZACAO_ID,
          userId: ALVO_ID,
        },
      },
    });
  });

  test('exige sucessor quando era o único administrador com outras pessoas na equipe', async () => {
    prisma.comissaoEquipe.findMany.mockResolvedValue([
      vinculo(7, [
        { userId: ALVO_ID, papel: 'ADMINISTRADOR' },
        { userId: OUTRO_ID, papel: 'MEMBRO' },
      ]),
    ]);

    const response = await remover();

    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'Escolha quem vai assumir cada comissão listada antes de continuar.',
    );
    expect(response.body.comissoesPendentes).toEqual([
      {
        id: 7,
        nome: 'Comissão 7',
        organizacaoId: ORGANIZACAO_ID,
        membros: [pessoa(OUTRO_ID)],
      },
    ]);
    expect(prisma.comissaoEquipe.update).not.toHaveBeenCalled();
    expect(prisma.comissaoEquipe.deleteMany).not.toHaveBeenCalled();
    expect(prisma.comissao.deleteMany).not.toHaveBeenCalled();
    expect(prisma.organizacaoMembro.delete).not.toHaveBeenCalled();
  });

  test('recusa sucessor que não é da equipe da comissão', async () => {
    prisma.comissaoEquipe.findMany.mockResolvedValue([
      vinculo(7, [
        { userId: ALVO_ID, papel: 'ADMINISTRADOR' },
        { userId: OUTRO_ID, papel: 'MEMBRO' },
      ]),
    ]);

    const response = await remover(ALVO_ID, {
      sucessoresComissao: { 7: 99 },
    });

    expect(response.status).toBe(409);
    expect(prisma.organizacaoMembro.delete).not.toHaveBeenCalled();
  });

  test('promove o sucessor escolhido e conclui a remoção', async () => {
    prisma.comissaoEquipe.findMany.mockResolvedValue([
      vinculo(7, [
        { userId: ALVO_ID, papel: 'ADMINISTRADOR' },
        { userId: OUTRO_ID, papel: 'MEMBRO' },
      ]),
    ]);

    const response = await remover(ALVO_ID, {
      sucessoresComissao: { 7: OUTRO_ID },
    });

    expect(response.status).toBe(200);
    expect(prisma.comissaoEquipe.update).toHaveBeenCalledWith({
      where: { comissaoId_userId: { comissaoId: 7, userId: OUTRO_ID } },
      data: { papel: 'ADMINISTRADOR' },
    });
    expect(prisma.organizacaoMembro.delete).toHaveBeenCalled();
  });

  test('apaga a comissão cuja equipe era só o alvo e a informa em comissoesApagadas', async () => {
    prisma.comissaoEquipe.findMany.mockResolvedValue([
      vinculo(8, [{ userId: ALVO_ID, papel: 'ADMINISTRADOR' }]),
    ]);

    const response = await remover();

    expect(response.status).toBe(200);
    expect(response.body.comissoesApagadas).toEqual([8]);
    expect(prisma.comissao.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [8] } },
    });
    expect(prisma.organizacaoMembro.delete).toHaveBeenCalled();
  });

  test('o criador da organização continua sem poder ser removido', async () => {
    const response = await remover(CRIADOR_ID);
    expect(response.status).toBe(400);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.organizacaoMembro.delete).not.toHaveBeenCalled();
  });

  test('apaga convite pendente de reunião não encerrada e mantém o de reunião encerrada', async () => {
    jest.useFakeTimers({
      now: new Date('2026-10-21T13:30:00Z'),
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'setInterval'],
    });
    try {
      prisma.comissaoEquipe.findMany.mockResolvedValue([
        vinculo(7, [
          { userId: ALVO_ID, papel: 'MEMBRO' },
          { userId: OUTRO_ID, papel: 'ADMINISTRADOR' },
        ]),
      ]);
      const horario = { horaInicio: '10:00', horaFim: '11:00' };
      // a consulta já filtra por PENDENTE: convite ACEITO nem chega aqui.
      prisma.conviteReuniao.findMany.mockResolvedValue([
        {
          id: 100,
          reuniao: { data: '2026-10-21', status: 'AGENDADA', ...horario },
        },
        {
          id: 101,
          reuniao: { data: '2026-10-20', status: 'AGENDADA', ...horario },
        },
      ]);

      const response = await remover();

      expect(response.status).toBe(200);
      expect(prisma.conviteReuniao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: ALVO_ID,
            status: 'PENDENTE',
          }),
        }),
      );
      expect(prisma.conviteReuniao.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [100] } },
      });
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('acesso depois da remoção', () => {
  beforeEach(() => {
    // sem vínculo: a equipe da comissão não tem mais o ex-membro.
    prisma.comissao.findUnique.mockResolvedValue({
      id: 4,
      organizacao: { status: 'ACEITA' },
      equipe: [{ userId: OUTRO_ID }],
    });
  });

  test('não cria reunião na comissão', async () => {
    await expect(
      reuniaoService.create(ALVO_ID, { comissaoId: 4, convidados: [] }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('não registra entrada', async () => {
    prisma.reuniao.findUnique.mockResolvedValue({
      comissaoId: 4,
      status: 'AGENDADA',
      data: '2026-10-21',
      horaInicio: '10:00',
      horaFim: '11:00',
      criadoPorUserId: OUTRO_ID,
      convites: [],
    });
    await expect(reuniaoService.checkIn(ALVO_ID, 31)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('não edita a ata', async () => {
    prisma.reuniao.findUnique.mockResolvedValue({
      id: 31,
      comissao: { equipe: [] },
      registros: [{ id: 1 }],
    });
    await expect(ataService.assertCanEdit(ALVO_ID, 31)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
