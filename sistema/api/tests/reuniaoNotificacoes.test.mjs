import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

const criadorId = 7;
const reuniaoId = 31;
const jwtSecret = 'segredo-ficticio-dos-testes-de-notificacao';
const prisma = {
  reuniao: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  notificacao: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  lembreteEnviado: { deleteMany: jest.fn() },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { JWT_SECRET: jwtSecret },
}));
const { default: reuniaoRoutes } =
  await import('../src/routes/reuniaoRoutes.ts');
const { default: notificacaoRoutes } =
  await import('../src/routes/notificacaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', reuniaoRoutes, notificacaoRoutes);
app.use(handleError);

const tokenDe = (userId, role = 'USER') =>
  jwt.sign({ role, email: 'pessoa@example.test' }, jwtSecret, {
    subject: String(userId),
    expiresIn: '1h',
  });
const reuniao = {
  criadoPorUserId: criadorId,
  titulo: 'Planejamento',
  pauta: 'Pauta',
  descricao: null,
  local: 'Sala 3',
  data: '2026-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
  convites: [{ userId: 8 }, { userId: 9 }],
};
const corpo = {
  titulo: 'Planejamento',
  pauta: 'Pauta',
  local: 'Sala 3',
  data: '2026-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
};
const patch = (body, token = tokenDe(criadorId)) =>
  request(app)
    .patch(`/api/reunioes/${reuniaoId}`)
    .set('Authorization', `Bearer ${token}`)
    .send(body);
const remove = (token = tokenDe(criadorId)) =>
  request(app)
    .delete(`/api/reunioes/${reuniaoId}`)
    .set('Authorization', `Bearer ${token}`);
const destinatarios = () =>
  prisma.notificacao.createMany.mock.calls[0][0].data.map(
    (aviso) => aviso.userId,
  );

beforeEach(() => {
  jest.resetAllMocks();
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  prisma.reuniao.findUnique.mockResolvedValue(reuniao);
  prisma.reuniao.update.mockResolvedValue({ id: reuniaoId });
  prisma.reuniao.delete.mockResolvedValue({ id: reuniaoId });
  prisma.notificacao.createMany.mockResolvedValue({ count: 2 });
});

describe('PATCH /api/reunioes/:id', () => {
  test('remarcação avisa os convidados que não recusaram', async () => {
    const response = await patch({ ...corpo, horaInicio: '10:30' });
    expect(response.status).toBe(200);
    expect(prisma.reuniao.findUnique.mock.calls[0][0].select.convites).toEqual({
      where: { status: { not: 'RECUSADO' } },
      select: { userId: true },
    });
    expect(destinatarios()).toEqual([8, 9]);
    // Lembretes do horário antigo deixam de valer.
    expect(prisma.lembreteEnviado.deleteMany).toHaveBeenCalledWith({
      where: { reuniaoId },
    });
    expect(prisma.notificacao.createMany.mock.calls[0][0].data[0]).toEqual({
      userId: 8,
      tipo: 'REUNIAO_ATUALIZADA',
      reuniaoId,
      titulo: 'Reunião remarcada',
      mensagem: '"Planejamento" agora será em 21/10/2026, das 10:30 às 11:00.',
    });
  });

  test('mudança só nos detalhes gera aviso de atualização', async () => {
    await patch({ ...corpo, pauta: 'Nova pauta' });
    expect(prisma.lembreteEnviado.deleteMany).not.toHaveBeenCalled();
    expect(
      prisma.notificacao.createMany.mock.calls[0][0].data[0],
    ).toMatchObject({ titulo: 'Reunião atualizada' });
  });

  test('mudança de local gera aviso com o novo local', async () => {
    await patch({ ...corpo, local: 'https://meet.example.test/abc' });
    expect(
      prisma.notificacao.createMany.mock.calls[0][0].data[0],
    ).toMatchObject({
      titulo: 'Local da reunião alterado',
      mensagem: '"Planejamento" agora será em: https://meet.example.test/abc',
    });
    expect(prisma.reuniao.update.mock.calls[0][0].data.local).toBe(
      'https://meet.example.test/abc',
    );
  });

  test('local é obrigatório', async () => {
    const response = await patch({ ...corpo, local: '   ' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Informe o local ou o link da reunião.');
    expect(prisma.reuniao.update).not.toHaveBeenCalled();
  });

  test('salvar sem mudanças não avisa ninguém', async () => {
    const response = await patch({ ...corpo, descricao: '' });
    expect(response.status).toBe(200);
    expect(prisma.reuniao.update).toHaveBeenCalled();
    expect(prisma.notificacao.createMany).not.toHaveBeenCalled();
  });

  test('admin que não criou a reunião também avisa o criador', async () => {
    await patch({ ...corpo, data: '2026-10-22' }, tokenDe(99, 'ADMIN'));
    expect(destinatarios()).toEqual([criadorId, 8, 9]);
  });
});

describe('DELETE /api/reunioes/:id', () => {
  test('avisa os participantes antes de excluir, na mesma transação', async () => {
    const ordem = [];
    prisma.notificacao.createMany.mockImplementation(async () => {
      ordem.push('aviso');
      return { count: 2 };
    });
    prisma.reuniao.delete.mockImplementation(async () => {
      ordem.push('exclusao');
      return { id: reuniaoId };
    });

    const response = await remove();
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      'Reunião removida. 2 participante(s) avisado(s).',
    );
    expect(ordem).toEqual(['aviso', 'exclusao']);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.notificacao.createMany.mock.calls[0][0].data[0]).toEqual({
      userId: 8,
      tipo: 'REUNIAO_EXCLUIDA',
      reuniaoId,
      titulo: 'Reunião excluída',
      mensagem:
        '"Planejamento", marcada para 21/10/2026 às 10:00, foi excluída.',
    });
  });

  test('sem convidados, exclui sem gravar aviso', async () => {
    prisma.reuniao.findUnique.mockResolvedValue({ ...reuniao, convites: [] });
    const response = await remove();
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Reunião removida com sucesso.');
    expect(prisma.notificacao.createMany).not.toHaveBeenCalled();
    expect(prisma.reuniao.delete).toHaveBeenCalled();
  });

  test('quem não criou a reunião não exclui nem avisa', async () => {
    const response = await remove(tokenDe(8));
    expect(response.status).toBe(403);
    expect(prisma.notificacao.createMany).not.toHaveBeenCalled();
    expect(prisma.reuniao.delete).not.toHaveBeenCalled();
  });
});

describe('GET /api/reunioes/minhas', () => {
  test('devolve todos os convites com o nome do convidado', async () => {
    prisma.reuniao.findMany.mockResolvedValue([
      {
        id: reuniaoId,
        criadoPorUserId: criadorId,
        comissao: { id: 4, nome: 'Comissão', equipe: [] },
        registros: [],
        convites: [
          { id: 1, userId: 8, status: 'PENDENTE', user: { name: 'Ana' } },
          { id: 2, userId: 9, status: 'RECUSADO', user: { name: 'Bia' } },
        ],
      },
    ]);
    const response = await request(app)
      .get('/api/reunioes/minhas')
      .set('Authorization', `Bearer ${tokenDe(criadorId)}`);
    expect(response.status).toBe(200);
    expect(response.body[0].convites).toEqual([
      { id: 1, userId: 8, status: 'PENDENTE', nome: 'Ana' },
      { id: 2, userId: 9, status: 'RECUSADO', nome: 'Bia' },
    ]);
  });
});

describe('/api/notificacoes', () => {
  test('lista só as notificações do usuário do JWT', async () => {
    prisma.notificacao.findMany.mockResolvedValue([]);
    const response = await request(app)
      .get('/api/notificacoes')
      .set('Authorization', `Bearer ${tokenDe(8)}`);
    expect(response.status).toBe(200);
    expect(prisma.notificacao.findMany.mock.calls[0][0]).toMatchObject({
      where: { userId: 8 },
      orderBy: { createdAt: 'desc' },
    });
  });

  test('marca como lidas só as ainda não lidas do usuário', async () => {
    prisma.notificacao.updateMany.mockResolvedValue({ count: 3 });
    const response = await request(app)
      .patch('/api/notificacoes/lidas')
      .set('Authorization', `Bearer ${tokenDe(8)}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ lidas: 3 });
    expect(prisma.notificacao.updateMany.mock.calls[0][0].where).toEqual({
      userId: 8,
      lidaAt: null,
    });
  });

  test('remove só a notificação do próprio usuário', async () => {
    prisma.notificacao.deleteMany.mockResolvedValue({ count: 1 });
    const response = await request(app)
      .delete('/api/notificacoes/5')
      .set('Authorization', `Bearer ${tokenDe(8)}`);
    expect(response.status).toBe(200);
    expect(prisma.notificacao.deleteMany).toHaveBeenCalledWith({
      where: { id: 5, userId: 8 },
    });
  });

  test('notificação de outra pessoa ou inexistente responde 404', async () => {
    prisma.notificacao.deleteMany.mockResolvedValue({ count: 0 });
    const response = await request(app)
      .delete('/api/notificacoes/5')
      .set('Authorization', `Bearer ${tokenDe(8)}`);
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Notificação não encontrada.');
  });

  test('id malformado responde 400 sem consultar o banco', async () => {
    const response = await request(app)
      .delete('/api/notificacoes/abc')
      .set('Authorization', `Bearer ${tokenDe(8)}`);
    expect(response.status).toBe(400);
    expect(prisma.notificacao.deleteMany).not.toHaveBeenCalled();
  });

  test('limpar todas remove só as do usuário do JWT', async () => {
    prisma.notificacao.deleteMany.mockResolvedValue({ count: 4 });
    const response = await request(app)
      .delete('/api/notificacoes')
      .set('Authorization', `Bearer ${tokenDe(8)}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ removidas: 4 });
    expect(prisma.notificacao.deleteMany).toHaveBeenCalledWith({
      where: { userId: 8 },
    });
  });

  test('exige autenticação', async () => {
    const response = await request(app).get('/api/notificacoes');
    expect(response.status).toBe(401);
  });
});
