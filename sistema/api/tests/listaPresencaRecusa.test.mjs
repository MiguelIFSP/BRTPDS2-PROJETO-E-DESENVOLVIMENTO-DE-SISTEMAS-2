import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const reuniaoId = 31;
const administradorId = 8;
const participanteId = 7;

const prisma = { reuniao: { findUnique: jest.fn(), findMany: jest.fn() } };
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
const { assertRecusaSemPresenca } =
  await import('../src/services/recusaConviteService.ts');

const pessoa = { name: 'Pessoa convidada', email: 'pessoa@example.test' };

const meeting = (extra = {}) => ({
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
  convites: [{ userId: participanteId, status: 'RECUSADO', user: pessoa }],
  registros: [],
  presencasManuais: [],
  eventosPresenca: [],
  ...extra,
});

const marcacao = (status, observacao = null) => ({
  userId: participanteId,
  status,
  observacao,
  updatedAt: new Date('2026-10-21T13:05:00Z'),
  marcadoPor: { name: 'Administradora' },
  user: pessoa,
});

const evento = {
  id: 1,
  userId: participanteId,
  tipo: 'SAIDA',
  ocorridoAt: new Date('2026-10-21T13:30:00Z'),
  motivo: null,
  createdAt: new Date('2026-10-21T13:30:00Z'),
  registradoPor: { name: 'Administradora' },
  user: pessoa,
};

const consultar = async (extra) => {
  prisma.reuniao.findUnique.mockResolvedValue(meeting(extra));
  const lista = await listaPresencaService.getByReuniao(
    administradorId,
    'USER',
    reuniaoId,
  );
  return lista.participantes.find((item) => item.userId === participanteId);
};

beforeEach(() => jest.resetAllMocks());

describe('quem entra na lista de presença', () => {
  test('quem recusou sem nada anotado fica fora', async () => {
    await expect(consultar({})).resolves.toBeUndefined();
  });

  test.each([
    ['marcação de presença', { presencasManuais: [marcacao('PRESENTE')] }],
    ['marcação de ausência', { presencasManuais: [marcacao('AUSENTE')] }],
    ['observação', { presencasManuais: [marcacao(null, 'Justificou.')] }],
    ['evento', { eventosPresenca: [evento] }],
  ])('mantém quem recusou e tem %s', async (_caso, extra) => {
    await expect(consultar(extra)).resolves.toMatchObject({
      convite: 'RECUSADO',
    });
  });

  test('mantém quem tem anotação e ficou sem convite', async () => {
    await expect(
      consultar({ convites: [], presencasManuais: [marcacao('PRESENTE')] }),
    ).resolves.toMatchObject({ nome: pessoa.name, convite: null });
  });
});

describe('recusa de convite com presença na lista', () => {
  const recusar = (status = 'RECUSADO') =>
    assertRecusaSemPresenca(participanteId, 5, status);

  test('bloqueia com 409 quando há presença ou evento', async () => {
    prisma.reuniao.findMany.mockResolvedValue([{ id: reuniaoId }]);
    await expect(recusar()).rejects.toMatchObject({ statusCode: 409 });
  });

  test('procura só presença marcada ou evento do próprio convite', async () => {
    prisma.reuniao.findMany.mockResolvedValue([]);
    await expect(recusar()).resolves.toBeUndefined();
    expect(prisma.reuniao.findMany.mock.calls[0][0].where).toEqual({
      convites: {
        some: {
          id: 5,
          userId: participanteId,
          status: { not: 'RECUSADO' },
        },
      },
      OR: [
        {
          presencasManuais: {
            some: { userId: participanteId, status: 'PRESENTE' },
          },
        },
        { eventosPresenca: { some: { userId: participanteId } } },
      ],
    });
  });

  test('aceitar o convite não consulta a lista', async () => {
    await recusar('ACEITO');
    expect(prisma.reuniao.findMany).not.toHaveBeenCalled();
  });
});
