import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { criarAuthSimulado, tokenDe } from './sessaoSimulada.mjs';

const userId = 7;
const reuniaoId = 31;
const prisma = {
  user: { findUnique: jest.fn() },
  reuniao: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  comissao: { findUnique: jest.fn() },
  reuniaoRegistro: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
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
const { default: routes } = await import('../src/routes/reuniaoRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const { reuniaoService } = await import('../src/services/reuniaoService.ts');
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(handleError);

const call = (
  suffix,
  body = { codigoPresenca: '123456' },
  actor = userId,
  id = reuniaoId,
) =>
  request(app)
    .post(`/api/reunioes/${id}/${suffix}`)
    .set('Authorization', `Bearer ${tokenDe(actor)}`)
    .send(body);
const horarioReuniao = {
  data: '2026-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
};
const registro = {
  id: 12,
  reuniaoId,
  userId,
  entradaAt: new Date('2026-10-21T13:00:00Z'),
  saidaAt: null,
};
let meeting;
let equipe;
let persisted;
const emUtc = (instante) =>
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
beforeEach(() => {
  jest.resetAllMocks();
  emUtc('2026-10-21T13:30:00Z');
  meeting = {
    id: reuniaoId,
    comissaoId: 4,
    criadoPorUserId: 8,
    codigoPresenca: '123456',
    status: 'AGENDADA',
    ataExportadaAt: null,
    convites: [{ userId, status: 'ACEITO' }],
    ...horarioReuniao,
  };
  equipe = [
    { userId, papel: 'MEMBRO' },
    { userId: 8, papel: 'ADMINISTRADOR' },
  ];
  persisted = null;
  prisma.user.findUnique.mockResolvedValue({
    role: 'ADMIN',
    email: 'teste@example.test',
  });
  prisma.reuniao.findUnique.mockImplementation(async () => meeting);
  prisma.comissao.findUnique.mockImplementation(async () => ({
    id: 4,
    organizacao: { status: 'ACEITA' },
    equipe,
  }));
  prisma.$queryRaw.mockResolvedValue([{ id: reuniaoId }]);
  // A fila representa a serialização do bloqueio da reunião; o teste MySQL verifica o bloqueio real.
  let queue = Promise.resolve();
  prisma.$transaction.mockImplementation((callback) => {
    const pending = queue.then(() => callback(prisma));
    queue = pending.catch(() => {});
    return pending;
  });
  prisma.reuniaoRegistro.findUnique.mockImplementation(async () => persisted);
  prisma.reuniaoRegistro.create.mockImplementation(async ({ data }) => {
    persisted = { id: 12, saidaAt: null, ...data };
    return persisted;
  });
  prisma.reuniaoRegistro.update.mockImplementation(async ({ data }) => {
    persisted = { ...persisted, ...data };
    return persisted;
  });
  prisma.reuniao.update.mockImplementation(async ({ data }) =>
    Object.assign(meeting, data),
  );
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('registro próprio de presença', () => {
  test('usa identidade autenticada, código e horário do servidor', async () => {
    const response = await call('entrar', {
      codigoPresenca: '123456',
      userId: 999,
      entradaAt: '1999-01-01',
    });
    expect(response.status).toBe(201);
    expect(response.body.registro).toMatchObject({
      userId,
      entradaAt: '2026-10-21T13:30:00.000Z',
      origemEntrada: 'PROPRIO',
      entradaManualPorId: null,
    });
  });
  test.each(['entrar', 'sair'])(
    '%s não permite registro antes do início, mesmo com presença antiga',
    async (acao) => {
      persisted = registro;
      emUtc('2026-10-21T12:59:59Z');
      const response = await call(acao);
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/antes do início/);
      expect(prisma.reuniaoRegistro.update).not.toHaveBeenCalled();
      expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
    },
  );
  test('permite entrada exatamente no início', async () => {
    emUtc('2026-10-21T13:00:00Z');
    expect((await call('entrar')).status).toBe(201);
  });
  test.each(['entrar', 'sair'])(
    '%s valida código ausente, malformado e incorreto',
    async (acao) => {
      for (const body of [
        {},
        { codigoPresenca: 'abc' },
        { codigoPresenca: '654321' },
      ]) {
        expect((await call(acao, body)).status).toBe(400);
      }
      expect(prisma.reuniaoRegistro.create).not.toHaveBeenCalled();
      expect(prisma.reuniaoRegistro.update).not.toHaveBeenCalled();
    },
  );
  test('saída exige entrada e preserva o horário inicial', async () => {
    expect((await call('sair')).status).toBe(409);
    persisted = registro;
    const response = await call('sair');
    expect(response.status).toBe(200);
    expect(response.body.registro).toMatchObject({
      entradaAt: registro.entradaAt.toISOString(),
      saidaAt: '2026-10-21T13:30:00.000Z',
      origemSaida: 'PROPRIO',
    });
  });
  test.each(['entrar', 'sair'])('%s simultâneo é idempotente', async (acao) => {
    if (acao === 'sair') persisted = registro;
    const responses = await Promise.all([call(acao), call(acao)]);
    expect(responses.map((response) => response.status).sort()).toEqual(
      acao === 'entrar' ? [200, 201] : [200, 200],
    );
    expect(responses[0].body.registro).toEqual(responses[1].body.registro);
    expect(
      prisma.reuniaoRegistro[acao === 'entrar' ? 'create' : 'update'],
    ).toHaveBeenCalledTimes(1);
  });
  test('saída atrasada é permitida, nova entrada própria após término não', async () => {
    emUtc('2026-10-21T16:00:00Z');
    expect((await call('entrar')).status).toBe(409);
    persisted = registro;
    expect((await call('sair')).status).toBe(200);
  });
  test.each(['entrar', 'sair'])('reunião cancelada impede %s', async (acao) => {
    meeting.status = 'CANCELADA';
    persisted = registro;
    expect((await call(acao)).status).toBe(409);
  });
  test('valida id, sessão, existência, vínculo e aceite', async () => {
    expect((await call('entrar', {}, userId, 'abc')).status).toBe(400);
    expect((await request(app).post('/api/reunioes/31/entrar')).status).toBe(
      401,
    );
    equipe = [];
    expect((await call('entrar')).status).toBe(403);
    equipe = [{ userId, papel: 'MEMBRO' }];
    meeting.convites = [];
    expect((await call('entrar')).status).toBe(403);
    meeting = null;
    expect((await call('entrar')).status).toBe(404);
  });
  test('não acrescenta presenças depois de finalizar a ata', async () => {
    meeting.ataExportadaAt = new Date();
    expect((await call('entrar')).status).toBe(409);
    expect((await call('participantes/7/entrar', {}, 8)).status).toBe(409);
  });
});

describe('código e registro manual pelo administrador da comissão', () => {
  test('administrador não usa registro manual para contornar a própria confirmação', async () => {
    expect((await call('participantes/8/entrar', {}, 8)).status).toBe(403);
  });
  test('somente administrador da comissão visualiza e renova código', async () => {
    for (const actor of [7, 8]) {
      const response = await request(app)
        .get('/api/reunioes/31/codigo-presenca')
        .set('Authorization', `Bearer ${tokenDe(actor)}`);
      expect(response.status).toBe(actor === 8 ? 200 : 403);
      if (actor === 7)
        expect(JSON.stringify(response.body)).not.toContain('123456');
    }
    expect((await call('codigo-presenca', {})).status).toBe(403);
    const renewed = await call('codigo-presenca', {}, 8);
    expect(renewed.status).toBe(200);
    expect(renewed.body.codigoPresenca).toMatch(/^\d{6}$/);
    expect(renewed.body.codigoPresenca).not.toBe('123456');
    expect((await call('entrar')).status).toBe(400);
    expect(
      (await call('entrar', { codigoPresenca: renewed.body.codigoPresenca }))
        .status,
    ).toBe(201);
  });
  test('administrador registra entrada e saída sem PIN, com autoria e idempotência', async () => {
    expect((await call('participantes/7/entrar', {}, 7)).status).toBe(403);
    const entrada = await call('participantes/7/entrar', {}, 8);
    expect(entrada.status).toBe(201);
    expect(entrada.body.registro).toMatchObject({
      userId: 7,
      origemEntrada: 'MANUAL',
      entradaManualPorId: 8,
    });
    expect(
      (await call('participantes/7/entrar', {}, 8)).body.jaRegistrado,
    ).toBe(true);
    const saida = await call('participantes/7/sair', {}, 8);
    expect(saida.status).toBe(200);
    expect(saida.body.registro).toMatchObject({
      origemSaida: 'MANUAL',
      saidaManualPorId: 8,
    });
    expect((await call('participantes/7/sair', {}, 8)).body.jaRegistrado).toBe(
      true,
    );
  });
  test.each(['entrar', 'sair'])(
    'registro manual %s respeita início e participante da comissão',
    async (acao) => {
      expect((await call(`participantes/99/${acao}`, {}, 8)).status).toBe(403);
      emUtc('2026-10-21T12:59:59Z');
      expect((await call(`participantes/7/${acao}`, {}, 8)).status).toBe(400);
    },
  );
  test('não registra saída manual sem entrada e permite corrigir após término', async () => {
    expect((await call('participantes/7/sair', {}, 8)).status).toBe(409);
    emUtc('2026-10-21T16:00:00Z');
    expect((await call('participantes/7/entrar', {}, 8)).status).toBe(201);
  });
});

describe('presença ao recarregar reuniões', () => {
  test('meuRegistro traz só o registro do usuário autenticado e a relação interna fica de fora', async () => {
    const outroId = 8;
    const registroDoOutro = { ...registro, id: 13, userId: outroId };
    const comissao = {
      id: 4,
      nome: 'Comissão de Teste',
      equipe: [
        {
          userId,
          papel: 'MEMBRO',
          user: { name: 'Integrante', email: 'integrante@example.test' },
        },
        {
          userId: outroId,
          papel: 'ADMINISTRADOR',
          user: { name: 'Organizador', email: 'organizador@example.test' },
        },
      ],
    };
    prisma.reuniao.findMany.mockResolvedValue([
      {
        id: reuniaoId,
        status: 'AGENDADA',
        ...horarioReuniao,
        criadoPorUserId: outroId,
        comissao,
        convites: [
          { id: 1, userId, status: 'ACEITO', user: { name: 'Integrante' } },
        ],
        registros: [registroDoOutro, registro],
        votacoes: [],
      },
      {
        id: 32,
        status: 'AGENDADA',
        ...horarioReuniao,
        criadoPorUserId: outroId,
        comissao,
        convites: [],
        registros: [registroDoOutro],
        votacoes: [],
      },
    ]);

    const [comPresenca, semPresenca] = await reuniaoService.listMine(userId);

    expect(comPresenca.meuRegistro).toEqual(registro);
    expect(semPresenca.meuRegistro).toBeNull();
    expect(comPresenca).not.toHaveProperty('registros');
    // 12:45Z (15 min antes do início) até 14:30Z (30 min depois do fim).
    expect(comPresenca.estado).toBe('EM_ANDAMENTO');
    expect(comPresenca.janelaCheckIn).toEqual({
      abre: '2026-10-21T13:00:00.000Z',
      fecha: '2026-10-21T14:30:00.000Z',
    });
    // a presença de cada participante sai junto dele, não numa lista solta.
    expect(
      comPresenca.participantes.map((participante) => [
        participante.userId,
        participante.registro,
      ]),
    ).toEqual([
      [userId, registro],
      [outroId, registroDoOutro],
    ]);
  });
});
