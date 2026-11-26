import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import { randomUUID } from 'node:crypto';

// Opt-in: nunca executa em banco de desenvolvimento ou produção.
const databaseUrl = process.env.PRESENCA_TEST_DATABASE_URL;
if (databaseUrl && !new URL(databaseUrl).pathname.endsWith('_test')) {
  throw new Error(
    'O banco de integração de presença precisa terminar em _test.',
  );
}
const suite = databaseUrl ? describe : describe.skip;

suite('presença e ata com bloqueio real no MySQL', () => {
  let prisma;
  let presencaService;
  let ataService;
  let pessoas = [];
  let organizacao;
  let reuniao;
  beforeAll(async () => {
    jest.unstable_mockModule('../src/config/env.ts', () => ({
      env: { DATABASE_URL: databaseUrl, TZ_REUNIOES: 'UTC' },
    }));
    ({ default: prisma } = await import('../src/config/database.ts'));
    ({ presencaService } = await import('../src/services/presencaService.ts'));
    ({ ataService } = await import('../src/services/ataService.ts'));
  });
  beforeEach(async () => {
    pessoas = [];
    for (let i = 0; i < 3; i++) {
      pessoas.push(
        await prisma.user.create({
          data: {
            name: 'Teste de presença',
            email: `${randomUUID()}@example.test`,
          },
        }),
      );
    }
    organizacao = await prisma.organizacao.create({
      data: { nome: 'Teste de presença e ata', status: 'ACEITA' },
    });
    const comissao = await prisma.comissao.create({
      data: {
        nome: 'Comissão de teste',
        organizacaoId: organizacao.id,
        equipe: {
          create: pessoas.map((pessoa, index) => ({
            userId: pessoa.id,
            papel: index === 0 ? 'ADMINISTRADOR' : 'MEMBRO',
          })),
        },
      },
    });
    reuniao = await prisma.reuniao.create({
      data: {
        titulo: 'Teste de concorrência',
        pauta: 'Presença e ata',
        comissaoId: comissao.id,
        criadoPorUserId: pessoas[0].id,
        data: '2020-01-01',
        horaInicio: '10:00',
        horaFim: '11:00',
        codigoPresenca: '123456',
        conteudoAta: '<p>Decisão.</p>',
        versaoAta: 1,
        convites: {
          create: pessoas
            .slice(1)
            .map((pessoa) => ({ userId: pessoa.id, status: 'ACEITO' })),
        },
      },
    });
  });
  afterEach(async () => {
    if (organizacao)
      await prisma.organizacao.delete({ where: { id: organizacao.id } });
    await prisma.user.deleteMany({
      where: { id: { in: pessoas.map((pessoa) => pessoa.id) } },
    });
    organizacao = null;
  });
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  const markAll = async () => {
    await prisma.reuniaoRegistro.createMany({
      data: pessoas.map((pessoa) => ({
        userId: pessoa.id,
        reuniaoId: reuniao.id,
      })),
    });
  };
  const approve = async () => {
    await markAll();
    // A maioria é formada somente pelos membros; o presidente não vota.
    await ataService.vote(pessoas[1].id, reuniao.id, 'APROVADO', 1);
    await ataService.vote(pessoas[2].id, reuniao.id, 'APROVADO', 1);
  };
  test('duas entradas e saídas simultâneas mantêm um único registro e autoria', async () => {
    for (const acao of ['entrada', 'saida']) {
      const results = await Promise.all(
        [1, 2].map(() =>
          presencaService.registerManual(
            pessoas[0].id,
            reuniao.id,
            pessoas[1].id,
            acao,
          ),
        ),
      );
      expect(results.map((result) => result.jaRegistrado).sort()).toEqual([
        false,
        true,
      ]);
      expect(results[0].registro).toEqual(results[1].registro);
    }
    const registro = await prisma.reuniaoRegistro.findFirst({
      where: { reuniaoId: reuniao.id },
    });
    expect(registro).toMatchObject({
      entradaManualPorId: pessoas[0].id,
      saidaManualPorId: pessoas[0].id,
      origemEntrada: 'MANUAL',
      origemSaida: 'MANUAL',
    });
  });
  test('membros aprovam antes do presidente e exportação trava texto e voto', async () => {
    await approve();
    const result = await ataService.exportar(pessoas[0].id, reuniao.id, 1);
    expect(result).toMatchObject({
      aprovada: true,
      exportada: true,
      meuVoto: null,
    });
    await expect(
      ataService.vote(pessoas[1].id, reuniao.id, 'REPROVADO', 1),
    ).rejects.toMatchObject({ statusCode: 409 });
    await expect(
      ataService.save(pessoas[0].id, reuniao.id, '<p>Outro texto.</p>', 1),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  test.each(['voto', 'texto'])(
    'finalização simultânea com alteração de %s nunca deixa documento inconsistente',
    async (acao) => {
      await approve();
      const results = await Promise.allSettled([
        ataService.exportar(pessoas[0].id, reuniao.id, 1),
        acao === 'voto'
          ? ataService.vote(pessoas[1].id, reuniao.id, 'REPROVADO', 1)
          : ataService.save(
              pessoas[0].id,
              reuniao.id,
              '<p>Outro texto.</p>',
              1,
            ),
      ]);
      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      const failure = results.find((result) => result.status === 'rejected');
      expect(failure.reason).toMatchObject({ statusCode: 409 });
      const current = await ataService.getByReuniao(pessoas[0].id, reuniao.id);
      if (current.exportada)
        expect(current).toMatchObject({
          conteudoAta: '<p>Decisão.</p>',
          votos: { aprovados: 2, reprovados: 0 },
        });
      else expect(current.aprovada).toBe(false);
    },
  );
});
