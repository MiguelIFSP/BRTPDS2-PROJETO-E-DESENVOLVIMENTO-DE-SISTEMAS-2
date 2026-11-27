import { beforeEach, describe, expect, jest, test } from '@jest/globals';

const sendMail = jest.fn();
const prisma = {
  reuniao: { findMany: jest.fn(), findUnique: jest.fn() },
  conviteReuniao: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  reuniaoRegistro: { findUnique: jest.fn() },
  votacaoVoto: { count: jest.fn() },
  comissaoEquipe: { findUnique: jest.fn() },
};
jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));
jest.unstable_mockModule('../src/config/database.ts', () => ({
  default: prisma,
}));
jest.unstable_mockModule('../src/config/env.ts', () => ({
  env: {
    GMAIL_USER: 'bettermeet@example.test',
    GMAIL_APP_PASSWORD: 'senha-de-app',
    MAIL_FROM_NAME: 'Better Meet',
    TZ_REUNIOES: 'America/Sao_Paulo',
    API_PUBLIC_URL: 'http://192.168.0.110:3333',
  },
}));
const { reuniaoService } = await import('../src/services/reuniaoService.ts');

const aguardarSegundoPlano = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const DATA_FUTURA = '2099-10-22';
const DATA_PASSADA = '2020-01-10';

const conviteSalvo = (status) => ({
  id: 5,
  reuniaoId: 31,
  status,
  reuniao: {
    titulo: 'Planejamento',
    pauta: 'Pauta',
    descricao: null,
    local: 'Sala 4',
    data: DATA_FUTURA,
    horaInicio: '10:00',
    horaFim: '11:00',
    comissao: { nome: 'Comissão de Teste' },
    criadoPor: { name: 'Ana Souza' },
  },
});

beforeEach(() => {
  jest.resetAllMocks();
  sendMail.mockResolvedValue({});
  prisma.reuniaoRegistro.findUnique.mockResolvedValue(null);
  prisma.votacaoVoto.count.mockResolvedValue(0);
});

describe('mudar a resposta de um convite já respondido', () => {
  const conviteParaResponder = (status, reuniao = {}) => ({
    userId: 3,
    reuniaoId: 31,
    status,
    reuniao: {
      status: 'AGENDADA',
      data: DATA_FUTURA,
      horaFim: '11:00',
      ...reuniao,
    },
  });

  test('quem aceitou pode recusar', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaResponder('ACEITO'),
    );
    prisma.conviteReuniao.update.mockResolvedValue(conviteSalvo('RECUSADO'));

    const convite = await reuniaoService.respondInvite(3, 5, 'RECUSADO');

    expect(convite.status).toBe('RECUSADO');
    expect(prisma.conviteReuniao.update.mock.calls[0][0]).toMatchObject({
      where: { id: 5 },
      data: { status: 'RECUSADO' },
    });
  });

  test('quem recusou pode aceitar', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaResponder('RECUSADO'),
    );
    prisma.conviteReuniao.update.mockResolvedValue(conviteSalvo('ACEITO'));

    const convite = await reuniaoService.respondInvite(3, 5, 'ACEITO');

    expect(convite.status).toBe('ACEITO');
    expect(prisma.conviteReuniao.update).toHaveBeenCalledTimes(1);
  });

  test('a mesma resposta de novo não grava nada', async () => {
    prisma.conviteReuniao.findUnique
      .mockResolvedValueOnce(conviteParaResponder('ACEITO'))
      .mockResolvedValueOnce(conviteSalvo('ACEITO'));

    const convite = await reuniaoService.respondInvite(3, 5, 'ACEITO');

    expect(convite.status).toBe('ACEITO');
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('quem já registrou presença não pode recusar', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaResponder('ACEITO'),
    );
    prisma.reuniaoRegistro.findUnique.mockResolvedValue({ id: 9 });

    await expect(
      reuniaoService.respondInvite(3, 5, 'RECUSADO'),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.reuniaoRegistro.findUnique.mock.calls[0][0].where).toEqual({
      reuniaoId_userId: { reuniaoId: 31, userId: 3 },
    });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('quem já votou não pode recusar', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaResponder('ACEITO'),
    );
    prisma.votacaoVoto.count.mockResolvedValue(1);

    await expect(
      reuniaoService.respondInvite(3, 5, 'RECUSADO'),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.votacaoVoto.count.mock.calls[0][0].where).toEqual({
      userId: 3,
      votacao: { reuniaoId: 31 },
    });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('depois do fim da reunião a resposta não muda (410)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaResponder('RECUSADO', { data: DATA_PASSADA }),
    );

    await expect(
      reuniaoService.respondInvite(3, 5, 'ACEITO'),
    ).rejects.toMatchObject({ statusCode: 410 });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('reunião cancelada não aceita mudança (409)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaResponder('ACEITO', { status: 'CANCELADA' }),
    );

    await expect(
      reuniaoService.respondInvite(3, 5, 'RECUSADO'),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('reenviar convite', () => {
  const conviteParaReenviar = (status, reuniao = {}, equipe = [3]) => ({
    id: 5,
    userId: 3,
    reuniaoId: 31,
    status,
    user: { name: 'Caio' },
    reuniao: {
      criadoPorUserId: 1,
      comissaoId: 4,
      status: 'AGENDADA',
      data: DATA_FUTURA,
      horaFim: '11:00',
      comissao: { equipe: equipe.map((userId) => ({ userId })) },
      ...reuniao,
    },
  });
  const reuniaoDoEmail = {
    criadoPorUserId: 1,
    status: 'AGENDADA',
    titulo: 'Planejamento',
    pauta: 'Pauta',
    descricao: null,
    local: 'Sala 4',
    data: DATA_FUTURA,
    horaInicio: '10:00',
    horaFim: '11:00',
    criadoPor: { name: 'Ana Souza' },
    comissao: { nome: 'Comissão de Teste' },
    convites: [],
  };

  test.each(['ACEITO', 'RECUSADO', 'PENDENTE'])(
    'convite %s volta a sem resposta e o e-mail sai de novo com o mesmo link',
    async (status) => {
      prisma.conviteReuniao.findUnique.mockResolvedValue(
        conviteParaReenviar(status),
      );
      prisma.conviteReuniao.update.mockResolvedValue({});
      prisma.reuniao.findUnique.mockResolvedValue(reuniaoDoEmail);
      prisma.conviteReuniao.findMany.mockResolvedValue([
        {
          tokenResposta: 'tok-caio',
          user: { name: 'Caio', email: 'caio@example.test' },
        },
      ]);

      const resultado = await reuniaoService.resendInvite(1, 'USER', 5);
      await aguardarSegundoPlano();

      expect(resultado).toEqual({ message: 'Convite reenviado para Caio.' });
      expect(prisma.conviteReuniao.update.mock.calls[0][0]).toEqual({
        where: { id: 5 },
        data: { status: 'PENDENTE', respondidoAt: null },
      });
      expect(sendMail).toHaveBeenCalledTimes(1);
      const mensagem = sendMail.mock.calls[0][0];
      expect(mensagem.subject).toMatch(/^Convite reenviado: Planejamento/);
      expect(mensagem.text).toContain('reenviou o convite');
      expect(mensagem.icalEvent.method).toBe('REQUEST');
      expect(mensagem.html).toContain(
        'href="http://192.168.0.110:3333/api/convites/tok-caio?resposta=aceitar"',
      );
    },
  );

  test('convite inexistente responde 404', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(null);
    await expect(
      reuniaoService.resendInvite(1, 'USER', 5),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test('quem não gere a reunião não reenvia (403)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaReenviar('RECUSADO'),
    );
    prisma.comissaoEquipe.findUnique.mockResolvedValue({ papel: 'MEMBRO' });

    await expect(
      reuniaoService.resendInvite(8, 'USER', 5),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('Administrador da comissão pode reenviar', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaReenviar('RECUSADO'),
    );
    prisma.comissaoEquipe.findUnique.mockResolvedValue({
      papel: 'ADMINISTRADOR',
    });
    prisma.conviteReuniao.update.mockResolvedValue({});

    await expect(reuniaoService.resendInvite(8, 'USER', 5)).resolves.toEqual({
      message: 'Convite reenviado para Caio.',
    });
  });

  test.each(['CANCELADA', 'REALIZADA'])(
    'reunião %s não reenvia (409)',
    async (status) => {
      prisma.conviteReuniao.findUnique.mockResolvedValue(
        conviteParaReenviar('RECUSADO', { status }),
      );
      await expect(
        reuniaoService.resendInvite(1, 'USER', 5),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
    },
  );

  test('reunião que já terminou não reenvia (410)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaReenviar('PENDENTE', { data: DATA_PASSADA }),
    );
    await expect(
      reuniaoService.resendInvite(1, 'USER', 5),
    ).rejects.toMatchObject({ statusCode: 410 });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('quem saiu da comissão não recebe reenvio (409)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaReenviar('RECUSADO', {}, [2]),
    );
    await expect(
      reuniaoService.resendInvite(1, 'USER', 5),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('quem aceitou e já registrou presença não recebe reenvio (409)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaReenviar('ACEITO'),
    );
    prisma.reuniaoRegistro.findUnique.mockResolvedValue({ id: 9 });
    await expect(
      reuniaoService.resendInvite(1, 'USER', 5),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('quem aceitou e já votou não recebe reenvio (409)', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteParaReenviar('ACEITO'),
    );
    prisma.votacaoVoto.count.mockResolvedValue(2);
    await expect(
      reuniaoService.resendInvite(1, 'USER', 5),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('reunião vista por quem recusou e pelo organizador', () => {
  const reuniaoDaLista = {
    id: 31,
    comissaoId: 4,
    titulo: 'Planejamento',
    pauta: 'Pauta',
    descricao: null,
    local: 'Sala 4',
    data: DATA_FUTURA,
    horaInicio: '10:00',
    horaFim: '11:00',
    status: 'AGENDADA',
    criadoPorUserId: 1,
    criadoPor: { name: 'Ana Souza' },
    convites: [
      { id: 5, userId: 3, status: 'RECUSADO', user: { name: 'Caio' } },
      { id: 6, userId: 4, status: 'ACEITO', user: { name: 'Bia' } },
      { id: 7, userId: 5, status: 'ACEITO', user: { name: 'Davi' } },
      { id: 8, userId: 6, status: 'ACEITO', user: { name: 'Eva' } },
    ],
    comissao: {
      id: 4,
      nome: 'Comissão de Teste',
      equipe: [1, 3, 4, 5, 6].map((userId) => ({
        userId,
        papel: userId === 1 ? 'ADMINISTRADOR' : 'MEMBRO',
        user: { name: `Pessoa ${userId}`, email: `p${userId}@example.test` },
      })),
    },
    registros: [
      {
        id: 1,
        userId: 4,
        entradaAt: new Date('2099-10-22T13:00:00Z'),
        saidaAt: null,
        origemEntrada: 'PROPRIO',
        origemSaida: null,
        entradaManualPorId: null,
        saidaManualPorId: null,
      },
    ],
    votacoes: [{ votos: [{ userId: 5 }] }],
  };

  test('a lista inclui as reuniões em que o convite foi recusado', async () => {
    prisma.reuniao.findMany.mockResolvedValue([]);
    await reuniaoService.listMine(3);
    const where = prisma.reuniao.findMany.mock.calls[0][0].where;
    expect(where.OR[1]).toEqual({
      convites: {
        some: { userId: 3, status: { in: ['ACEITO', 'RECUSADO'] } },
      },
    });
  });

  test('quem recusou abre a reunião e vê o próprio convite', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(reuniaoDaLista);

    const reuniao = await reuniaoService.getById(3, 'USER', 31);

    expect(reuniao.meuConvite).toEqual({ id: 5, status: 'RECUSADO' });
    expect(reuniao.participantes.map((p) => p.userId)).not.toContain(3);
    expect(reuniao).not.toHaveProperty('votacoes');
  });

  test('sem convite (criador), meuConvite é nulo', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(reuniaoDaLista);
    const reuniao = await reuniaoService.getById(1, 'USER', 31);
    expect(reuniao.meuConvite).toBeNull();
  });

  test('podeReenviar é falso só para quem aceitou e registrou presença ou votou', async () => {
    prisma.reuniao.findUnique.mockResolvedValue(reuniaoDaLista);

    const reuniao = await reuniaoService.getById(1, 'USER', 31);

    expect(
      Object.fromEntries(
        reuniao.convites.map((convite) => [convite.id, convite.podeReenviar]),
      ),
    ).toEqual({ 5: true, 6: false, 7: false, 8: true });
  });
});
