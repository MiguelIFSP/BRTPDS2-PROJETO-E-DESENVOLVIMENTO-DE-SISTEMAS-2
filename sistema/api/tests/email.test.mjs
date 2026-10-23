import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Prisma } from '@prisma/client';
import express from 'express';
import request from 'supertest';

const fuso = 'America/Sao_Paulo';
const sendMail = jest.fn();
const prisma = {
  reuniao: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
  conviteReuniao: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
  },
  comissao: { findUnique: jest.fn() },
  user: { findMany: jest.fn() },
  lembreteEnviado: {
    create: jest.fn(),
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
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
    TZ_REUNIOES: fuso,
    API_PUBLIC_URL: 'http://192.168.0.110:3333',
  },
}));
const { instanteNoFuso, dataNoFuso } =
  await import('../src/utils/fusoHorario.ts');
const { buildIcs } = await import('../src/utils/ics.ts');
const { emailTemplates } = await import('../src/utils/emailTemplates.ts');
const { emailService } = await import('../src/services/emailService.ts');
const { lembreteService } = await import('../src/services/lembreteService.ts');
const { reuniaoService } = await import('../src/services/reuniaoService.ts');
const { default: conviteRespostaRoutes } =
  await import('../src/routes/conviteRespostaRoutes.ts');
const { handleError } = await import('../src/middlewares/errorMiddleware.ts');
const app = express();
app.use('/api', conviteRespostaRoutes);
app.use(handleError);

// Espera os envios disparados em segundo plano terminarem.
const aguardarSegundoPlano = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const reuniaoEmail = {
  id: 31,
  titulo: 'Planejamento',
  pauta: 'Orçamento; metas, prazos',
  descricao: null,
  local: 'Sala 4 e https://meet.example.test/abc?x=1&y=2',
  data: '2026-10-22',
  horaInicio: '10:00',
  horaFim: '11:00',
  comissao: 'Comissão de Teste',
  organizador: 'Ana Souza',
};
const em = (iso) => new Date(iso);

beforeEach(() => {
  jest.resetAllMocks();
  sendMail.mockResolvedValue({});
  prisma.$transaction.mockImplementation((callback) => callback(prisma));
  prisma.lembreteEnviado.create.mockResolvedValue({});
  prisma.lembreteEnviado.createMany.mockResolvedValue({ count: 0 });
  prisma.lembreteEnviado.deleteMany.mockResolvedValue({ count: 1 });
});

describe('fuso horário', () => {
  test('lê data e hora no fuso das reuniões', () => {
    expect(instanteNoFuso('2026-10-22', '10:00', fuso).toISOString()).toBe(
      '2026-10-22T13:00:00.000Z',
    );
  });

  test('data local de um instante perto da meia-noite', () => {
    expect(dataNoFuso(em('2026-10-23T02:30:00Z'), fuso)).toBe('2026-10-22');
  });
});

describe('.ics', () => {
  const evento = {
    reuniaoId: 31,
    titulo: 'Planejamento, Q4; revisão',
    descricao: `Pauta: linha 1\nlinha 2 ${'x'.repeat(120)}`,
    local: 'Sala 4',
    inicio: em('2026-10-22T13:00:00Z'),
    fim: em('2026-10-22T14:00:00Z'),
    organizador: { nome: 'Ana Souza', email: 'bettermeet@example.test' },
    participante: { nome: 'Bia', email: 'bia@example.test' },
  };

  test('convite com UID fixo, horários em UTC e texto escapado', () => {
    const ics = buildIcs('REQUEST', evento, em('2026-10-21T12:00:00Z'));
    expect(ics).toContain('METHOD:REQUEST');
    expect(ics).toContain('UID:reuniao-31@better-meet');
    expect(ics).toContain('DTSTART:20261022T130000Z');
    expect(ics).toContain('DTEND:20261022T140000Z');
    expect(ics).toContain('SUMMARY:Planejamento\\, Q4\\; revisão');
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('mailto:bia@example.test');
  });

  test('linhas com no máximo 75 bytes, terminadas em CRLF', () => {
    const ics = buildIcs('REQUEST', evento);
    const linhas = ics.split('\r\n');
    expect(linhas.every((linha) => Buffer.byteLength(linha) <= 75)).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  test('cancelamento usa o mesmo UID e SEQUENCE maior', () => {
    const convite = buildIcs('REQUEST', evento, em('2026-10-21T12:00:00Z'));
    const cancelamento = buildIcs('CANCEL', evento, em('2026-10-21T13:00:00Z'));
    const sequencia = (ics) => Number(/SEQUENCE:(\d+)/.exec(ics)[1]);
    expect(cancelamento).toContain('METHOD:CANCEL');
    expect(cancelamento).toContain('STATUS:CANCELLED');
    expect(cancelamento).toContain('UID:reuniao-31@better-meet');
    expect(sequencia(cancelamento)).toBeGreaterThan(sequencia(convite));
  });
});

describe('emailTemplates', () => {
  test('escapa HTML e transforma o link do local em <a>', () => {
    const email = emailTemplates.convite({
      ...reuniaoEmail,
      titulo: '<script>x</script>',
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).toContain(
      '<a href="https://meet.example.test/abc?x=1&amp;y=2"',
    );
    expect(email.assunto).toBe(
      'Convite: <script>x</script> – 22/10/2026 às 10:00',
    );
    expect(email.texto).toContain('Local: Sala 4 e https://meet');
  });
});

describe('quais lembretes estão na hora', () => {
  const naHora = (iso, horaInicio = '10:00') =>
    lembreteService
      .listDue('2026-10-22', horaInicio, fuso, em(iso))
      .map((lembrete) => lembrete.tipo);

  test('07h, 1 hora e 15 minutos antes de uma reunião às 10h', () => {
    expect(naHora('2026-10-22T10:00:00Z')).toEqual(['MANHA']); // 07h local
    expect(naHora('2026-10-22T12:00:00Z')).toEqual(['UMA_HORA']); // 09h
    expect(naHora('2026-10-22T12:45:00Z')).toEqual(['QUINZE_MINUTOS']); // 09h45
  });

  test('fora da janela ou depois do início, nada', () => {
    expect(naHora('2026-10-22T09:59:00Z')).toEqual([]); // 06h59
    expect(naHora('2026-10-22T10:11:00Z')).toEqual([]); // 07h11: passou
    expect(naHora('2026-10-22T13:00:00Z')).toEqual([]); // começou
  });

  test('reunião até 08h não recebe o lembrete das 07h', () => {
    expect(naHora('2026-10-22T10:00:00Z', '08:00')).toEqual(['UMA_HORA']);
    expect(naHora('2026-10-22T10:00:00Z', '07:30')).toEqual([]);
  });

  test('lembretes que vencem juntos vêm em ordem, o mais próximo por último', () => {
    // Reunião 08h05: 07h e 07h05 (1 hora antes) dentro da mesma tolerância.
    expect(naHora('2026-10-22T10:06:00Z', '08:05')).toEqual([
      'MANHA',
      'UMA_HORA',
    ]);
  });
});

describe('job de lembretes', () => {
  const criador = { id: 1, name: 'Ana Souza', email: 'ana@example.test' };
  const aceito = { id: 2, name: 'Bia', email: 'bia@example.test' };
  const reuniaoDoJob = (lembretes = []) => ({
    ...reuniaoEmail,
    criadoPor: criador,
    comissao: { nome: 'Comissão de Teste' },
    convites: [{ user: aceito }],
    lembretes,
  });
  const agora = em('2026-10-22T12:00:00Z'); // 09h local, 1 hora antes

  test('envia para o criador e quem aceitou, reservando antes', async () => {
    prisma.reuniao.findMany.mockResolvedValue([reuniaoDoJob()]);

    expect(await lembreteService.sendDue(agora)).toBe(2);

    const consulta = prisma.reuniao.findMany.mock.calls[0][0];
    expect(consulta.where).toEqual({
      status: 'AGENDADA',
      data: { in: ['2026-10-22', '2026-10-23'] },
    });
    expect(consulta.select.convites.where).toEqual({ status: 'ACEITO' });
    expect(
      prisma.lembreteEnviado.create.mock.calls.map((c) => c[0].data),
    ).toEqual([
      { reuniaoId: 31, userId: 1, tipo: 'UMA_HORA' },
      { reuniaoId: 31, userId: 2, tipo: 'UMA_HORA' },
    ]);
    expect(sendMail.mock.calls.map((c) => c[0].to.address)).toEqual([
      'ana@example.test',
      'bia@example.test',
    ]);
    expect(sendMail.mock.calls[0][0].subject).toBe('Em 1 hora: Planejamento');
    expect(sendMail.mock.calls[0][0].icalEvent).toBeUndefined();
  });

  test('com dois lembretes vencidos, envia só o mais próximo', async () => {
    prisma.reuniao.findMany.mockResolvedValue([
      { ...reuniaoDoJob(), horaInicio: '08:05', convites: [] },
    ]);

    expect(await lembreteService.sendDue(em('2026-10-22T10:06:00Z'))).toBe(1);
    expect(prisma.lembreteEnviado.create.mock.calls[0][0].data.tipo).toBe(
      'UMA_HORA',
    );
    expect(prisma.lembreteEnviado.createMany.mock.calls[0][0]).toEqual({
      data: [{ reuniaoId: 31, userId: 1, tipo: 'MANHA', enviado: false }],
      skipDuplicates: true,
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  test('não repete quem já recebeu nem disputa com outra instância', async () => {
    prisma.reuniao.findMany.mockResolvedValue([
      reuniaoDoJob([{ userId: 1, tipo: 'UMA_HORA' }]),
    ]);
    prisma.lembreteEnviado.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicado', {
        code: 'P2002',
        clientVersion: Prisma.prismaVersion.client,
      }),
    );

    expect(await lembreteService.sendDue(agora)).toBe(0);
    expect(prisma.lembreteEnviado.create).toHaveBeenCalledTimes(1);
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('falha no envio libera a reserva para a próxima passada', async () => {
    prisma.reuniao.findMany.mockResolvedValue([
      { ...reuniaoDoJob(), convites: [] },
    ]);
    sendMail.mockRejectedValue(new Error('SMTP fora'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(await lembreteService.sendDue(agora)).toBe(0);
    expect(prisma.lembreteEnviado.deleteMany).toHaveBeenCalledWith({
      where: { reuniaoId: 31, userId: 1, tipo: 'UMA_HORA' },
    });
  });
});

describe('e-mails disparados pelas reuniões', () => {
  const reuniaoAviso = {
    criadoPorUserId: 1,
    titulo: 'Planejamento',
    pauta: 'Pauta',
    descricao: null,
    local: 'Sala 4',
    data: '2026-10-22',
    horaInicio: '10:00',
    horaFim: '11:00',
    criadoPor: { name: 'Ana Souza' },
    comissao: { nome: 'Comissão de Teste' },
    convites: [],
  };

  test('convidar gera token e manda e-mail com .ics e botões só para quem é novo', async () => {
    prisma.reuniao.findUnique
      .mockResolvedValueOnce({
        criadoPorUserId: 1,
        comissaoId: 4,
        comissao: { equipe: [{ userId: 2 }, { userId: 3 }] },
      })
      .mockResolvedValueOnce(reuniaoAviso);
    prisma.conviteReuniao.findMany
      .mockResolvedValueOnce([{ userId: 2 }]) // quem já tinha convite
      .mockResolvedValueOnce([
        {
          tokenResposta: 'tok-caio',
          user: { name: 'Caio', email: 'caio@example.test' },
        },
      ]);
    prisma.conviteReuniao.createMany.mockResolvedValue({ count: 1 });

    await reuniaoService.inviteMembers(1, 'USER', 31, [2, 3]);
    await aguardarSegundoPlano();

    const [novo] = prisma.conviteReuniao.createMany.mock.calls[0][0].data;
    expect(novo).toMatchObject({ reuniaoId: 31, userId: 3 });
    expect(novo.tokenResposta).toMatch(/^[\w-]{43}$/);
    expect(prisma.conviteReuniao.findMany.mock.calls[1][0].where).toEqual({
      reuniaoId: 31,
      userId: { in: [3] },
    });
    expect(sendMail).toHaveBeenCalledTimes(1);
    const mensagem = sendMail.mock.calls[0][0];
    expect(mensagem.to).toEqual({ name: 'Caio', address: 'caio@example.test' });
    expect(mensagem.from).toEqual({
      name: 'Better Meet',
      address: 'bettermeet@example.test',
    });
    expect(mensagem.icalEvent.method).toBe('REQUEST');
    expect(mensagem.icalEvent.content).toContain('LOCATION:Sala 4');
    expect(mensagem.html).toContain(
      'href="http://192.168.0.110:3333/api/convites/tok-caio?resposta=aceitar"',
    );
    expect(mensagem.html).toContain(
      'href="http://192.168.0.110:3333/api/convites/tok-caio?resposta=recusar"',
    );
    expect(mensagem.text).toContain(
      'Aceitar: http://192.168.0.110:3333/api/convites/tok-caio?resposta=aceitar',
    );
  });

  test('convite antigo, sem token, sai sem os botões', async () => {
    await emailService.sendConvite(reuniaoEmail, [
      { nome: 'Bia', email: 'bia@example.test', tokenResposta: null },
    ]);
    const mensagem = sendMail.mock.calls[0][0];
    expect(mensagem.html).not.toContain('/api/convites/');
    expect(mensagem.text).toContain('Aceite ou recuse o convite pelo app.');
  });

  test('falha do Gmail não derruba a operação', async () => {
    sendMail.mockRejectedValue(new Error('SMTP fora'));
    const erro = jest.spyOn(console, 'error').mockImplementation(() => {});

    const enviados = await emailService.sendExclusao(reuniaoEmail, [
      { nome: 'Bia', email: 'bia@example.test' },
    ]);

    expect(enviados).toBe(0);
    expect(erro).toHaveBeenCalled();
  });

  test('exclusão manda .ics de cancelamento', async () => {
    await emailService.sendExclusao(reuniaoEmail, [
      { nome: 'Bia', email: 'bia@example.test' },
    ]);
    const mensagem = sendMail.mock.calls[0][0];
    expect(mensagem.subject).toBe('Reunião excluída: Planejamento');
    expect(mensagem.icalEvent.method).toBe('CANCEL');
    expect(mensagem.icalEvent.content).toContain('STATUS:CANCELLED');
  });
});

describe('botões Aceitar/Recusar do e-mail', () => {
  const token = 'tok-valido-do-convite';
  const dataFutura = '2099-10-22';
  const conviteDaPagina = (
    status = 'PENDENTE',
    reuniaoStatus = 'AGENDADA',
  ) => ({
    id: 5,
    userId: 3,
    status,
    user: { name: 'Caio' },
    reuniao: {
      titulo: 'Planejamento <Q4>',
      data: dataFutura,
      horaInicio: '10:00',
      horaFim: '11:00',
      local: 'Sala 4',
      status: reuniaoStatus,
      comissao: { nome: 'Comissão de Teste' },
    },
  });
  const confirmar = (resposta = 'aceitar') =>
    request(app).post(`/api/convites/${token}`).type('form').send({ resposta });

  test('abrir o link só pede confirmação, sem gravar a resposta', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(conviteDaPagina());

    const response = await request(app).get(
      `/api/convites/${token}?resposta=aceitar`,
    );

    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.text).toContain('Confirmar: aceitar');
    expect(response.text).toContain(`action="/api/convites/${token}"`);
    expect(response.text).toContain('Planejamento &lt;Q4&gt;');
    expect(prisma.conviteReuniao.findUnique.mock.calls[0][0].where).toEqual({
      tokenResposta: token,
    });
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('sem resposta na URL, mostra as duas opções', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(conviteDaPagina());
    const response = await request(app).get(`/api/convites/${token}`);
    expect(response.text).toContain('value="aceitar"');
    expect(response.text).toContain('value="recusar"');
  });

  test('token inválido ou de reunião excluída responde 404', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(null);
    const response = await request(app).get('/api/convites/nao-existe');
    expect(response.status).toBe(404);
    expect(response.text).toContain('Convite não encontrado');
  });

  test('convite já respondido não oferece os botões de novo', async () => {
    prisma.conviteReuniao.findUnique.mockResolvedValue(
      conviteDaPagina('RECUSADO'),
    );
    const response = await request(app).get(
      `/api/convites/${token}?resposta=aceitar`,
    );
    expect(response.text).toContain('Sua resposta foi: recusado');
    expect(response.text).not.toContain('<form');
  });

  test('confirmar grava a resposta do dono do token com as regras do app', async () => {
    prisma.conviteReuniao.findUnique
      .mockResolvedValueOnce({ id: 5, userId: 3 }) // pelo token
      .mockResolvedValueOnce({
        userId: 3,
        status: 'PENDENTE',
        reuniao: { status: 'AGENDADA', data: dataFutura, horaFim: '11:00' },
      });
    prisma.conviteReuniao.update.mockResolvedValue({
      id: 5,
      reuniaoId: 31,
      status: 'ACEITO',
      reuniao: {
        titulo: 'Planejamento',
        pauta: 'Pauta',
        descricao: null,
        local: 'Sala 4',
        data: '2026-10-22',
        horaInicio: '10:00',
        horaFim: '11:00',
        comissao: { nome: 'Comissão de Teste' },
        criadoPor: { name: 'Ana Souza' },
      },
    });

    const response = await confirmar();

    expect(response.status).toBe(200);
    expect(response.text).toContain('Presença confirmada');
    expect(prisma.conviteReuniao.update.mock.calls[0][0]).toMatchObject({
      where: { id: 5 },
      data: { status: 'ACEITO' },
    });
  });

  test('confirmar um convite já respondido mostra o erro do app', async () => {
    prisma.conviteReuniao.findUnique
      .mockResolvedValueOnce({ id: 5, userId: 3 })
      .mockResolvedValueOnce({
        userId: 3,
        status: 'ACEITO',
        reuniao: { status: 'AGENDADA', data: dataFutura, horaFim: '11:00' },
      });

    const response = await confirmar();

    expect(response.status).toBe(409);
    expect(response.text).toContain('Este convite já foi respondido.');
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('link de reunião que já terminou não oferece os botões', async () => {
    const convite = conviteDaPagina();
    convite.reuniao.data = '2020-01-10';
    prisma.conviteReuniao.findUnique.mockResolvedValue(convite);

    const response = await request(app).get(
      `/api/convites/${token}?resposta=aceitar`,
    );

    expect(response.status).toBe(410);
    expect(response.text).toContain('Reunião encerrada');
    expect(response.text).not.toContain('<form');
  });

  test('confirmar depois do fim da reunião é recusado', async () => {
    prisma.conviteReuniao.findUnique
      .mockResolvedValueOnce({ id: 5, userId: 3 })
      .mockResolvedValueOnce({
        userId: 3,
        status: 'PENDENTE',
        reuniao: { status: 'AGENDADA', data: '2020-01-10', horaFim: '11:00' },
      });

    const response = await confirmar();

    expect(response.status).toBe(410);
    expect(response.text).toContain('Esta reunião já terminou');
    expect(prisma.conviteReuniao.update).not.toHaveBeenCalled();
  });

  test('resposta inválida no formulário responde 400', async () => {
    const response = await confirmar('talvez');
    expect(response.status).toBe(400);
    expect(prisma.conviteReuniao.findUnique).not.toHaveBeenCalled();
  });
});

describe('expiração do convite ao fim da reunião', () => {
  test('vale até o horário de término, no fuso das reuniões', () => {
    const reuniao = { data: '2026-10-22', horaFim: '11:00' }; // 14:00 UTC
    expect(
      reuniaoService.isConviteExpirado(reuniao, em('2026-10-22T13:59:00Z')),
    ).toBe(false);
    expect(
      reuniaoService.isConviteExpirado(reuniao, em('2026-10-22T14:00:00Z')),
    ).toBe(true);
  });

  test('convites pendentes de reuniões encerradas saem da lista', async () => {
    const convite = (id, data) => ({
      id,
      reuniaoId: id,
      status: 'PENDENTE',
      reuniao: {
        titulo: `Reunião ${id}`,
        pauta: 'Pauta',
        descricao: null,
        local: 'Sala 4',
        data,
        horaInicio: '10:00',
        horaFim: '11:00',
        comissao: { nome: 'Comissão' },
        criadoPor: { name: 'Ana' },
      },
    });
    prisma.conviteReuniao.findMany.mockResolvedValue([
      convite(1, '2020-01-10'),
      convite(2, '2099-10-22'),
    ]);

    const pendentes = await reuniaoService.listPendingInvites(3);

    expect(pendentes.map((pendente) => pendente.id)).toEqual([2]);
  });
});
