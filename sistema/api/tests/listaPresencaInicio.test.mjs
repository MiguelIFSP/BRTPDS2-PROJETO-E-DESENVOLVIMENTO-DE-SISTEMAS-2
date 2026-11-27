import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';

const reuniaoId = 31;
const administradorId = 8;
const participanteId = 7;

const prisma = {
  reuniao: { findUnique: jest.fn() },
  reuniaoPresenca: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  reuniaoEventoPresenca: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: { TZ_REUNIOES: 'America/Sao_Paulo' },
}));
jest.unstable_mockModule('../src/services/permissaoReuniaoService.ts', () => ({
  podeGerirReuniao: async () => true,
}));
const { listaPresencaService } =
  await import('../src/services/listaPresencaService.ts');

// 10:00 em America/Sao_Paulo é 13:00 em UTC.
const meeting = {
  id: reuniaoId,
  titulo: 'Revisão de pauta',
  data: '2026-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
  local: null,
  status: 'AGENDADA',
  comissaoId: 4,
  criadoPorUserId: administradorId,
  criadoPor: { name: 'Administradora', email: 'admin@example.test' },
  comissao: {
    id: 4,
    nome: 'Comissão de teste',
    organizacao: { id: 1, nome: 'Organização de teste' },
    equipe: [],
  },
  convites: [
    {
      userId: participanteId,
      status: 'ACEITO',
      user: { name: 'Pessoa convidada', email: 'pessoa@example.test' },
    },
  ],
  registros: [],
  presencasManuais: [],
  eventosPresenca: [],
};

const agoraEm = (instante) => jest.useFakeTimers({ now: new Date(instante) });

const updateMark = (data) =>
  listaPresencaService.updateMark(
    administradorId,
    'USER',
    reuniaoId,
    participanteId,
    data,
  );

const addEvent = () =>
  listaPresencaService.addEvent(
    administradorId,
    'USER',
    reuniaoId,
    participanteId,
    { tipo: 'SAIDA', hora: '10:00' },
  );

const recusa = {
  statusCode: 409,
  message: 'A lista de presença só pode ser alterada após o início da reunião.',
};

beforeEach(() => {
  jest.resetAllMocks();
  prisma.reuniao.findUnique.mockResolvedValue(meeting);
  prisma.reuniaoPresenca.findUnique.mockResolvedValue(null);
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
});

afterEach(() => jest.useRealTimers());

describe('lista de presença antes do início da reunião', () => {
  beforeEach(() => agoraEm('2026-10-21T12:59:59Z'));

  test.each([
    ['marcação', { status: 'PRESENTE' }],
    ['limpeza da marcação', { status: 'SEM_MARCACAO' }],
    ['observações', { observacao: 'Avisou que vai se atrasar.' }],
  ])('recusa %s com 409 sem gravar', async (_caso, data) => {
    await expect(updateMark(data)).rejects.toMatchObject(recusa);
    expect(prisma.reuniaoPresenca.upsert).not.toHaveBeenCalled();
    expect(prisma.reuniaoPresenca.deleteMany).not.toHaveBeenCalled();
  });

  test('recusa saída ou retorno com 409 sem gravar', async () => {
    await expect(addEvent()).rejects.toMatchObject(recusa);
    expect(prisma.reuniaoEventoPresenca.create).not.toHaveBeenCalled();
  });

  test('continua permitindo a consulta', async () => {
    await expect(
      listaPresencaService.getByReuniao(administradorId, 'USER', reuniaoId),
    ).resolves.toMatchObject({ totais: { participantes: 2 } });
  });
});

describe('lista de presença a partir do início da reunião', () => {
  test.each([
    ['no instante do início', '2026-10-21T13:00:00Z'],
    ['depois do término', '2026-10-21T15:00:00Z'],
  ])('aceita marcação %s', async (_caso, instante) => {
    agoraEm(instante);
    await updateMark({ status: 'PRESENTE' });
    expect(prisma.reuniaoPresenca.upsert).toHaveBeenCalledTimes(1);
  });

  test('aceita saída no instante do início', async () => {
    agoraEm('2026-10-21T13:00:00Z');
    prisma.reuniaoPresenca.findUnique.mockResolvedValue({ status: 'PRESENTE' });
    prisma.reuniaoEventoPresenca.create.mockResolvedValue({
      id: 1,
      tipo: 'SAIDA',
      ocorridoAt: new Date('2026-10-21T13:00:00Z'),
      motivo: null,
      createdAt: new Date('2026-10-21T13:00:00Z'),
      registradoPor: { name: 'Administradora' },
    });
    await expect(addEvent()).resolves.toMatchObject({ tipo: 'SAIDA' });
  });
});
