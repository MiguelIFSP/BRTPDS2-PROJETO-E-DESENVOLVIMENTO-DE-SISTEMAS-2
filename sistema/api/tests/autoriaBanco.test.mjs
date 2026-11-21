import { afterAll, beforeEach, describe, expect, test } from '@jest/globals';
import { bancoDisponivel, prepararAmbiente } from './ambienteIntegracao.mjs';

const describeBanco = bancoDisponivel() ? describe : describe.skip;

// Roda a migration de verdade (banco de teste): autoria anulada na exclusão da
// conta, padrões das colunas novas de votação e voto nulo.
describeBanco('autoria opcional e votação no banco', () => {
  let ambiente;
  let contador = 0;
  beforeEach(async () => {
    ambiente ??= await prepararAmbiente();
  });
  afterAll(async () => {
    await ambiente?.encerrar();
  });

  const montar = async () => {
    const { prisma } = ambiente;
    const numero = ++contador;
    const criador = await ambiente.criarConta({
      email: ambiente.emailDe(`criador${numero}`),
    });
    const responsavel = await ambiente.criarConta({
      email: ambiente.emailDe(`responsavel${numero}`),
    });
    const organizacao = await prisma.organizacao.create({
      data: {
        nome: `Org ${numero}`,
        status: 'ACEITA',
        membros: {
          create: [
            { userId: responsavel.id, papel: 'CRIADOR' },
            { userId: criador.id, papel: 'MEMBRO' },
          ],
        },
      },
    });
    const comissao = await prisma.comissao.create({
      data: {
        nome: 'Comissão',
        organizacaoId: organizacao.id,
        equipe: {
          create: [
            { userId: responsavel.id, papel: 'ADMINISTRADOR' },
            { userId: criador.id, papel: 'MEMBRO' },
          ],
        },
      },
    });
    const reuniao = await prisma.reuniao.create({
      data: {
        comissaoId: comissao.id,
        titulo: 'Reunião',
        pauta: 'Pauta',
        local: 'Sala',
        data: '2099-01-01',
        horaInicio: '10:00',
        horaFim: '11:00',
        criadoPorUserId: criador.id,
      },
    });
    const votacao = await prisma.votacao.create({
      data: {
        reuniaoId: reuniao.id,
        titulo: 'Votação',
        criadoPorUserId: criador.id,
        opcoes: { create: [{ texto: 'Sim', ordem: 0 }] },
      },
      include: { opcoes: true },
    });
    return { criador, reuniao, votacao, organizacao };
  };

  test('excluir a conta de quem criou reunião e votação responde 200 e anula a autoria', async () => {
    const { criador, reuniao, votacao, organizacao } = await montar();
    const { bearer } = await ambiente.entrar(criador.email);

    const resposta = await ambiente.api(
      'delete',
      `/api/usuarios/${criador.id}/dados-pessoais`,
      { bearer, corpo: {} },
    );

    expect(resposta.status).toBe(200);
    const { prisma } = ambiente;
    expect(await prisma.user.findUnique({ where: { id: criador.id } })).toBe(
      null,
    );
    await expect(
      prisma.reuniao.findUnique({ where: { id: reuniao.id } }),
    ).resolves.toMatchObject({ criadoPorUserId: null });
    await expect(
      prisma.votacao.findUnique({ where: { id: votacao.id } }),
    ).resolves.toMatchObject({ criadoPorUserId: null });
    await prisma.organizacao.delete({ where: { id: organizacao.id } });
  });

  test('votação nova nasce aberta, sem parcial e sem troca; voto nulo é gravado', async () => {
    const { criador, votacao, organizacao } = await montar();
    const { prisma } = ambiente;
    expect(votacao).toMatchObject({
      tipo: 'ABERTA',
      mostrarParcial: false,
      permiteTrocaVoto: false,
    });

    const nulo = await prisma.votacaoVoto.create({
      data: { votacaoId: votacao.id, userId: criador.id, opcaoId: null },
    });
    expect(nulo.opcaoId).toBeNull();
    await prisma.organizacao.delete({ where: { id: organizacao.id } });
  });

  test('ata nasce sem exportação', async () => {
    const { reuniao, organizacao } = await montar();
    expect(reuniao).toMatchObject({
      ataExportadaAt: null,
      ataVersaoExportada: null,
    });
    await ambiente.prisma.organizacao.delete({ where: { id: organizacao.id } });
  });
});
