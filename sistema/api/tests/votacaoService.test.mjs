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
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const prisma = {
  user: { findUnique: jest.fn() },
  reuniao: { findUnique: jest.fn() },
  comissaoEquipe: { findUnique: jest.fn() },
  votacao: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  votacaoVoto: { create: jest.fn(), upsert: jest.fn() },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { TZ_REUNIOES: 'America/Sao_Paulo' },
}));
jest.unstable_mockModule('../src/lib/auth.ts', criarAuthSimulado);
const { default: routes } = await import('../src/routes/votacaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(handleError);

const PARTICIPANTE = 7;
const CRIADOR = 1;
const OUTRO_MEMBRO = 9;
const ADMIN_COMISSAO = 4;
// 21/10/2026, 10:00 às 11:00 em São Paulo (UTC-3): começa 13:00Z, termina 14:00Z.
const DURANTE = '2026-10-21T13:30:00Z';
const ANTES_DO_INICIO = '2026-10-21T12:50:00Z';
const DEPOIS_DO_FIM = '2026-10-21T14:00:00Z';

const emUtc = (instante) => {
  jest.useFakeTimers({
    now: new Date(instante),
    doNotFake: [
      'nextTick',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
      'queueMicrotask',
      'hrtime',
      'performance',
    ],
  });
};

let role;
let reuniao;
let registros;
let votacao;
let votos;
let papelNaComissao;

const como = (userId) => ({ Authorization: `Bearer ${tokenDe(userId)}` });
const get = (caminho, userId = PARTICIPANTE) =>
  request(app).get(`/api${caminho}`).set(como(userId));
const post = (caminho, corpo = {}, userId = PARTICIPANTE) =>
  request(app).post(`/api${caminho}`).set(como(userId)).send(corpo);

const PERCORRE_TUDO = JSON.stringify;
const semUserId = (corpo) => !/"userId"|"votantes"/.test(PERCORRE_TUDO(corpo));

beforeEach(() => {
  jest.resetAllMocks();
  emUtc(DURANTE);
  role = 'USER';
  papelNaComissao = null;
  reuniao = {
    comissaoId: 3,
    criadoPorUserId: CRIADOR,
    status: 'AGENDADA',
    data: '2026-10-21',
    horaInicio: '10:00',
    horaFim: '11:00',
  };
  // Quem aceitou o convite e quem tem registro de entrada, por usuário.
  registros = { [PARTICIPANTE]: { saidaAt: null } };
  votacao = {
    id: 50,
    reuniaoId: 31,
    titulo: 'Aprovar a pauta',
    tipo: 'ABERTA',
    mostrarParcial: true,
    permiteTrocaVoto: false,
    encerrada: false,
    createdAt: new Date('2026-10-21T12:00:00Z'),
    reuniao: { id: 31, titulo: 'Planejamento' },
    opcoes: [
      { id: 1, texto: 'Sim' },
      { id: 2, texto: 'Não' },
    ],
  };
  votos = [];

  prisma.user.findUnique.mockImplementation(async () => ({
    role,
    email: 'pessoa@example.test',
  }));
  prisma.reuniao.findUnique.mockImplementation(async ({ where }) => {
    if (where.id !== 31) return null;
    const userId = prismaUserId();
    return {
      ...reuniao,
      convites:
        userId === OUTRO_MEMBRO || userId === ADMIN_COMISSAO
          ? []
          : [{ id: 99 }],
      registros: registros[userId] ? [registros[userId]] : [],
    };
  });
  prisma.comissaoEquipe.findUnique.mockImplementation(async () =>
    papelNaComissao ? { papel: papelNaComissao } : null,
  );
  prisma.votacao.findUnique.mockImplementation(async ({ where, select }) => {
    if (where.id !== 50) return null;
    if (select.encerrada && !select.titulo) {
      return { encerrada: votacao.encerrada };
    }
    return {
      ...votacao,
      votos: votos.map((voto) => ({
        ...voto,
        user: { name: `Pessoa ${voto.userId}` },
      })),
    };
  });
  prisma.votacao.update.mockImplementation(async ({ data }) => {
    Object.assign(votacao, data);
  });
  prisma.votacao.create.mockResolvedValue({ id: 50 });
  prisma.votacaoVoto.create.mockImplementation(async ({ data }) => {
    if (votos.some((voto) => voto.userId === data.userId)) {
      throw new Prisma.PrismaClientKnownRequestError('Voto duplicado.', {
        code: 'P2002',
        clientVersion: Prisma.prismaVersion.client,
      });
    }
    votos.push({ userId: data.userId, opcaoId: data.opcaoId });
  });
  prisma.votacaoVoto.upsert.mockImplementation(async ({ create, update }) => {
    const existente = votos.find((voto) => voto.userId === create.userId);
    if (existente) Object.assign(existente, update);
    else votos.push({ userId: create.userId, opcaoId: create.opcaoId });
  });
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
});

afterEach(() => {
  jest.useRealTimers();
});

// O requireAuth já leu o usuário do token; o mock de reuniao precisa saber
// quem pergunta para montar os convites e registros daquela pessoa.
let usuarioDaRequisicao = PARTICIPANTE;
const prismaUserId = () => usuarioDaRequisicao;
const comoUsuario = async (userId, chamada) => {
  usuarioDaRequisicao = userId;
  return chamada();
};

const votar = (corpo, userId = PARTICIPANTE) =>
  comoUsuario(userId, () => post('/votacoes/50/voto', corpo, userId));
const ler = (userId = PARTICIPANTE, caminho = '/votacoes/50') =>
  comoUsuario(userId, () => get(caminho, userId));

describe('votar: só presentes, durante a reunião', () => {
  test('presente em reunião em andamento vota e o voto é contado', async () => {
    const response = await votar({ opcaoId: 1 });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      votei: true,
      meuVotoOpcaoId: 1,
      totalVotos: 1,
    });
    expect(response.body.opcoes[0]).toMatchObject({ id: 1, votos: 1 });
  });

  test('sem entrada registrada recebe 409', async () => {
    registros = {};
    const response = await votar({ opcaoId: 1 });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'Registre sua entrada na reunião para votar.',
    );
    expect(prisma.votacaoVoto.create).not.toHaveBeenCalled();
  });

  test('depois de registrar a saída não vota mais', async () => {
    registros = { [PARTICIPANTE]: { saidaAt: new Date() } };
    const response = await votar({ opcaoId: 1 });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'Você saiu da reunião e não pode mais votar.',
    );
  });

  test('antes do início da reunião (check-in aberto) recebe 409', async () => {
    emUtc(ANTES_DO_INICIO);
    const response = await votar({ opcaoId: 1 });
    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'A votação só abre quando a reunião começa.',
    );
  });

  test('depois do fim da reunião a votação está encerrada (410)', async () => {
    emUtc(DEPOIS_DO_FIM);
    const response = await votar({ opcaoId: 1 });
    expect(response.status).toBe(410);
    expect(response.body.error).toBe('Esta votação já foi encerrada.');
    expect(prisma.votacaoVoto.create).not.toHaveBeenCalled();
  });

  test('votação encerrada manualmente recusa o voto (410)', async () => {
    votacao.encerrada = true;
    expect((await votar({ opcaoId: 1 })).status).toBe(410);
  });

  test('integrante da comissão sem convite aceito não vota (403)', async () => {
    const response = await votar({ opcaoId: 1 }, OUTRO_MEMBRO);
    expect(response.status).toBe(403);
    expect(prisma.votacaoVoto.create).not.toHaveBeenCalled();
  });

  test('Administrador da comissão que não participa vê a votação, mas não vota', async () => {
    papelNaComissao = 'ADMINISTRADOR';
    const response = await votar({ opcaoId: 1 }, ADMIN_COMISSAO);
    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      'Só participantes da reunião podem votar.',
    );
  });

  test('ADMIN da plataforma que não participa não vota', async () => {
    role = 'ADMIN';
    expect((await votar({ opcaoId: 1 }, OUTRO_MEMBRO)).status).toBe(403);
  });

  test('opção de outra votação recebe 400', async () => {
    const response = await votar({ opcaoId: 999 });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Essa opção não pertence à votação.');
  });

  test('voto nulo é contado à parte e entra no total', async () => {
    const response = await votar({ nulo: true });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      votei: true,
      meuVotoOpcaoId: null,
      meuVotoNulo: true,
      totalVotos: 1,
      nulos: 1,
    });
    expect(response.body.opcoes.every((opcao) => opcao.votos === 0)).toBe(true);
  });

  test.each([{}, { opcaoId: 1, nulo: true }, { nulo: false }])(
    'corpo %j recebe 400 "Escolha uma opção ou o voto nulo."',
    async (corpo) => {
      const response = await votar(corpo);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Escolha uma opção ou o voto nulo.');
    },
  );
});

describe('troca de voto', () => {
  test('com a troca desligada o segundo voto é recusado (409)', async () => {
    expect((await votar({ opcaoId: 1 })).status).toBe(200);
    const segundo = await votar({ opcaoId: 2 });
    expect(segundo.status).toBe(409);
    expect(segundo.body.error).toBe('Esta votação não permite alterar o voto.');
    expect(votos).toEqual([{ userId: PARTICIPANTE, opcaoId: 1 }]);
  });

  test('com a troca ligada o voto muda e o total não dobra', async () => {
    votacao.permiteTrocaVoto = true;
    await votar({ opcaoId: 1 });
    const segundo = await votar({ opcaoId: 2 });
    expect(segundo.status).toBe(200);
    expect(segundo.body).toMatchObject({ meuVotoOpcaoId: 2, totalVotos: 1 });
    expect(segundo.body.podeVotar).toBe(true);
  });

  test('podeVotar fica falso depois do voto com a troca desligada', async () => {
    const response = await votar({ opcaoId: 1 });
    expect(response.body.podeVotar).toBe(false);
  });
});

describe('votação secreta e resultado parcial', () => {
  beforeEach(() => {
    votacao.tipo = 'SECRETA';
    votos = [
      { userId: 20, opcaoId: 1 },
      { userId: 21, opcaoId: 2 },
      { userId: 22, opcaoId: null },
    ];
  });

  test('getById não traz userId nem votantes, nem para quem gere', async () => {
    role = 'ADMIN';
    const response = await ler(CRIADOR);
    expect(response.status).toBe(200);
    expect(response.body.podeGerir).toBe(true);
    expect(response.body.opcoes[0].votos).toBe(1);
    expect(response.body.nulos).toBe(1);
    expect(semUserId(response.body)).toBe(true);
  });

  test('o Administrador da comissão também não vê quem votou em quê', async () => {
    papelNaComissao = 'ADMINISTRADOR';
    const response = await ler(ADMIN_COMISSAO);
    expect(response.status).toBe(200);
    expect(response.body.podeGerir).toBe(true);
    expect(semUserId(response.body)).toBe(true);
  });

  test('o voto do próprio usuário aparece só para ele', async () => {
    votos.push({ userId: PARTICIPANTE, opcaoId: 2 });
    const response = await ler(PARTICIPANTE);
    expect(response.body.meuVotoOpcaoId).toBe(2);
    expect(semUserId(response.body)).toBe(true);
  });

  test('listByReuniao não traz userId', async () => {
    prisma.votacao.findMany.mockResolvedValue([
      {
        id: 50,
        titulo: 'Aprovar a pauta',
        tipo: 'SECRETA',
        encerrada: false,
        createdAt: new Date(),
        _count: { votos: 3 },
        votos: [],
      },
    ]);
    const response = await ler(PARTICIPANTE, '/reunioes/31/votacoes');
    expect(response.status).toBe(200);
    expect(response.body[0]).toMatchObject({ tipo: 'SECRETA', totalVotos: 3 });
    expect(semUserId(response.body)).toBe(true);
  });

  test('o voto da votação secreta responde sem userId', async () => {
    const response = await votar({ opcaoId: 1 });
    expect(response.status).toBe(200);
    expect(semUserId(response.body)).toBe(true);
  });

  test('parcial desligado esconde totais por opção até encerrar', async () => {
    votacao.mostrarParcial = false;
    const aberta = await ler(PARTICIPANTE);
    expect(aberta.body.totalVotos).toBe(3);
    expect(aberta.body.nulos).toBeUndefined();
    expect(aberta.body.opcoes.every((opcao) => !('votos' in opcao))).toBe(true);

    emUtc(DEPOIS_DO_FIM);
    const encerrada = await ler(PARTICIPANTE);
    expect(encerrada.body.encerrada).toBe(true);
    expect(encerrada.body.opcoes[0].votos).toBe(1);
    expect(encerrada.body.nulos).toBe(1);
  });
});

describe('votação aberta: quem votou em quê', () => {
  beforeEach(() => {
    votos = [{ userId: 20, opcaoId: 1 }];
  });

  test('quem gere vê os votantes por opção', async () => {
    role = 'ADMIN';
    const response = await ler(CRIADOR);
    expect(response.body.opcoes[0].votantes).toEqual([
      { userId: 20, nome: 'Pessoa 20' },
    ]);
  });

  test('participante comum vê só os totais', async () => {
    const response = await ler(PARTICIPANTE);
    expect(response.body.opcoes[0].votos).toBe(1);
    expect(response.body.opcoes[0].votantes).toBeUndefined();
  });

  test('parcial oculto também esconde os votantes de quem gere', async () => {
    role = 'ADMIN';
    votacao.mostrarParcial = false;
    const response = await ler(CRIADOR);
    expect(response.body.opcoes[0].votantes).toBeUndefined();
  });
});

describe('criar, encerrar e excluir', () => {
  const corpo = {
    titulo: 'Aprovar o orçamento',
    opcoes: ['Sim', 'Não'],
    tipo: 'SECRETA',
    mostrarParcial: true,
  };

  test('Administrador da comissão cria votação com tipo e opções de resultado', async () => {
    papelNaComissao = 'ADMINISTRADOR';
    const response = await comoUsuario(ADMIN_COMISSAO, () =>
      post('/reunioes/31/votacoes', corpo, ADMIN_COMISSAO),
    );
    expect(response.status).toBe(201);
    expect(prisma.votacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: 'SECRETA',
          mostrarParcial: true,
          permiteTrocaVoto: false,
          criadoPorUserId: ADMIN_COMISSAO,
        }),
      }),
    );
  });

  test('participante comum não cria votação (403)', async () => {
    const response = await comoUsuario(PARTICIPANTE, () =>
      post('/reunioes/31/votacoes', corpo),
    );
    expect(response.status).toBe(403);
    expect(prisma.votacao.create).not.toHaveBeenCalled();
  });

  test('criador cria mesmo com autoria futura nula: reunião sem criador só aceita Administrador', async () => {
    reuniao.criadoPorUserId = null;
    const response = await comoUsuario(PARTICIPANTE, () =>
      post('/reunioes/31/votacoes', corpo),
    );
    expect(response.status).toBe(403);
  });

  test('reunião encerrada não aceita votação nova (409)', async () => {
    emUtc(DEPOIS_DO_FIM);
    const response = await comoUsuario(CRIADOR, () =>
      post('/reunioes/31/votacoes', corpo, CRIADOR),
    );
    expect(response.status).toBe(409);
    expect(prisma.votacao.create).not.toHaveBeenCalled();
  });

  test('tipo é obrigatório e precisa ser aberta ou secreta (400)', async () => {
    const { tipo, ...semTipo } = corpo;
    expect(tipo).toBe('SECRETA');
    const response = await comoUsuario(CRIADOR, () =>
      post('/reunioes/31/votacoes', semTipo, CRIADOR),
    );
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      'Escolha se a votação é aberta ou secreta.',
    );
  });

  test('encerrar por quem não gere recebe 403; quem gere encerra', async () => {
    expect(
      (await comoUsuario(PARTICIPANTE, () => post('/votacoes/50/encerrar')))
        .status,
    ).toBe(403);
    role = 'ADMIN';
    const response = await comoUsuario(CRIADOR, () =>
      post('/votacoes/50/encerrar', {}, CRIADOR),
    );
    expect(response.status).toBe(200);
    expect(response.body.encerrada).toBe(true);
  });
});
