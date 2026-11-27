import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const prisma = {
  user: { findUnique: jest.fn() },
  reuniao: { findUnique: jest.fn(), findMany: jest.fn() },
  conviteReuniao: { findMany: jest.fn() },
  comissaoEquipe: { findUnique: jest.fn() },
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { TZ_REUNIOES: 'America/Sao_Paulo' },
}));
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: routes } = await import('../src/routes/reuniaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(handleError);

const reuniaoSemCriador = {
  id: 31,
  comissaoId: 3,
  titulo: 'Planejamento',
  pauta: 'Pauta',
  descricao: null,
  local: 'Sala 3',
  data: '2099-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
  status: 'AGENDADA',
  criadoPorUserId: null,
  criadoPor: null,
  comissao: { id: 3, nome: 'Comissão', equipe: [] },
  convites: [{ id: 1, userId: 8, status: 'ACEITO', user: { name: 'Ana' } }],
  registros: [],
  votacoes: [],
};
const get = (caminho, userId) =>
  request(app)
    .get(`/api${caminho}`)
    .set('Authorization', `Bearer ${tokenDe(userId)}`);

beforeEach(() => {
  jest.resetAllMocks();
  prisma.user.findUnique.mockResolvedValue({
    role: 'USER',
    email: 'pessoa@example.test',
  });
  prisma.comissaoEquipe.findUnique.mockResolvedValue(null);
});

describe('reunião cuja autoria foi anulada (conta do criador excluída)', () => {
  test('getById devolve usuario e criadoPorUserId nulos', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(reuniaoSemCriador);
    const response = await get('/reunioes/31', 8);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      usuario: null,
      criadoPorUserId: null,
    });
  });

  test('a lista das minhas reuniões também tolera autoria nula', async () => {
    prisma.reuniao.findMany.mockResolvedValue([reuniaoSemCriador]);
    const response = await get('/reunioes/minhas', 8);
    expect(response.status).toBe(200);
    expect(response.body[0].usuario).toBeNull();
  });

  test('convite pendente mostra usuario nulo em vez de falhar', async () => {
    prisma.conviteReuniao.findMany.mockResolvedValue([
      {
        id: 1,
        reuniaoId: 31,
        status: 'PENDENTE',
        reuniao: {
          titulo: 'Planejamento',
          pauta: 'Pauta',
          descricao: null,
          local: 'Sala 3',
          data: '2099-10-21',
          horaInicio: '10:00',
          horaFim: '11:00',
          comissao: { nome: 'Comissão' },
          criadoPor: null,
        },
      },
    ]);
    const response = await get('/reunioes/convites', 8);
    expect(response.status).toBe(200);
    expect(response.body[0].usuario).toBeNull();
  });

  test('quem não participa nem gere não vê a reunião (403)', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(reuniaoSemCriador);
    expect((await get('/reunioes/31', 55)).status).toBe(403);
  });

  test('Administrador atual da comissão vê a reunião sem participar dela', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(reuniaoSemCriador);
    prisma.comissaoEquipe.findUnique.mockResolvedValue({
      papel: 'ADMINISTRADOR',
    });
    expect((await get('/reunioes/31', 55)).status).toBe(200);
  });
});
