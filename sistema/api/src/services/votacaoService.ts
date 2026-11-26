import {
  StatusConviteReuniao,
  TipoVotacao,
  type Prisma,
  type Role,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import type { VotacaoInput, VotoInput } from '../schemas/votacaoSchema.ts';
import { estadoDaReuniao, type EstadoReuniao } from '../utils/fusoHorario.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';
import { podeGerirReuniao } from './permissaoReuniaoService.ts';

type AcessoReuniao = {
  podeGerir: boolean;
  participa: boolean;
  temEntrada: boolean;
  saiu: boolean;
  // Entrada registrada e saída ainda não registrada.
  presente: boolean;
  estado: EstadoReuniao;
};

// Quem gere a reunião (criador, Administrador da comissão e ADMIN) vê e
// administra as votações. Participante (criador ou convite aceito) vota.
const acessoDaReuniao = async (
  userId: number,
  role: Role,
  reuniaoId: number,
): Promise<AcessoReuniao> => {
  const reuniao = await prisma.reuniao.findUnique({
    where: { id: reuniaoId },
    select: {
      comissaoId: true,
      criadoPorUserId: true,
      status: true,
      data: true,
      horaInicio: true,
      horaFim: true,
      convites: {
        where: { userId, status: StatusConviteReuniao.ACEITO },
        select: { id: true },
      },
      registros: { where: { userId }, select: { saidaAt: true } },
    },
  });
  if (!reuniao) {
    throw new AppError(404, 'Reunião não encontrada.');
  }
  const participa =
    reuniao.criadoPorUserId === userId || reuniao.convites.length > 0;
  const podeGerir = await podeGerirReuniao(userId, role, reuniao);
  if (!participa && !podeGerir) {
    throw new AppError(403, 'Você não pode ver esta reunião.');
  }
  const registro = reuniao.registros[0];
  return {
    podeGerir,
    participa,
    temEntrada: registro !== undefined,
    saiu: Boolean(registro?.saidaAt),
    presente: registro !== undefined && !registro.saidaAt,
    estado: estadoDaReuniao(reuniao, env.TZ_REUNIOES).estado,
  };
};

// A votação também fecha sozinha quando a reunião termina ou é cancelada.
const reuniaoFechada = (estado: EstadoReuniao) =>
  estado === 'ENCERRADA' || estado === 'CANCELADA';

const votacaoSelect = {
  id: true,
  reuniaoId: true,
  titulo: true,
  tipo: true,
  mostrarParcial: true,
  permiteTrocaVoto: true,
  encerrada: true,
  createdAt: true,
  reuniao: { select: { id: true, titulo: true } },
  opcoes: {
    orderBy: { ordem: 'asc' },
    select: { id: true, texto: true },
  },
  votos: {
    select: {
      userId: true,
      opcaoId: true,
      user: { select: { name: true } },
    },
    orderBy: { user: { name: 'asc' } },
  },
} satisfies Prisma.VotacaoSelect;

type VotacaoRow = Prisma.VotacaoGetPayload<{ select: typeof votacaoSelect }>;

const apresentar = (
  votacao: VotacaoRow,
  userId: number,
  acesso: AcessoReuniao,
) => {
  const encerrada = votacao.encerrada || reuniaoFechada(acesso.estado);
  const meuVoto = votacao.votos.find((voto) => voto.userId === userId);
  // Sem resultado parcial, os totais por opção só saem depois do encerramento.
  const mostrarTotais = votacao.mostrarParcial || encerrada;
  // Na votação secreta nenhuma estrutura leva userId ou nome de quem votou.
  const mostrarVotantes =
    mostrarTotais && acesso.podeGerir && votacao.tipo === TipoVotacao.ABERTA;

  return {
    id: votacao.id,
    reuniaoId: votacao.reuniaoId,
    titulo: votacao.titulo,
    tipo: votacao.tipo,
    mostrarParcial: votacao.mostrarParcial,
    permiteTrocaVoto: votacao.permiteTrocaVoto,
    encerrada,
    createdAt: votacao.createdAt,
    reuniao: votacao.reuniao,
    podeGerir: acesso.podeGerir,
    totalVotos: votacao.votos.length,
    votei: meuVoto !== undefined,
    meuVotoOpcaoId: meuVoto?.opcaoId ?? null,
    meuVotoNulo: meuVoto !== undefined && meuVoto.opcaoId === null,
    podeVotar:
      acesso.participa &&
      acesso.presente &&
      acesso.estado === 'EM_ANDAMENTO' &&
      !encerrada &&
      (meuVoto === undefined || votacao.permiteTrocaVoto),
    ...(mostrarTotais
      ? {
          nulos: votacao.votos.filter((voto) => voto.opcaoId === null).length,
        }
      : {}),
    opcoes: votacao.opcoes.map((opcao) => {
      const votos = votacao.votos.filter((voto) => voto.opcaoId === opcao.id);
      return {
        id: opcao.id,
        texto: opcao.texto,
        ...(mostrarTotais ? { votos: votos.length } : {}),
        ...(mostrarVotantes
          ? {
              votantes: votos.map((voto) => ({
                userId: voto.userId,
                nome: voto.user.name,
              })),
            }
          : {}),
      };
    }),
  };
};

const carregar = async (votacaoId: number) => {
  const votacao = await prisma.votacao.findUnique({
    where: { id: votacaoId },
    select: votacaoSelect,
  });
  if (!votacao) {
    throw new AppError(404, 'Votação não encontrada.');
  }
  return votacao;
};

const MENSAGEM_ENCERRADA = 'Esta votação já foi encerrada.';
const MENSAGEM_SEM_TROCA = 'Esta votação não permite alterar o voto.';

const assertPodeVotar = (acesso: AcessoReuniao) => {
  if (!acesso.temEntrada) {
    throw new AppError(409, 'Registre sua entrada na reunião para votar.');
  }
  if (acesso.saiu) {
    throw new AppError(409, 'Você saiu da reunião e não pode mais votar.');
  }
  if (acesso.estado !== 'EM_ANDAMENTO') {
    throw new AppError(409, 'A votação só abre quando a reunião começa.');
  }
};

export const votacaoService = {
  async listByReuniao(userId: number, role: Role, reuniaoId: number) {
    const acesso = await acessoDaReuniao(userId, role, reuniaoId);
    const votacoes = await prisma.votacao.findMany({
      where: { reuniaoId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titulo: true,
        tipo: true,
        encerrada: true,
        createdAt: true,
        _count: { select: { votos: true } },
        // Só o voto de quem pede: serve para "votei" e nada mais sai daqui.
        votos: { where: { userId }, select: { id: true } },
      },
    });
    return votacoes.map((votacao) => ({
      id: votacao.id,
      titulo: votacao.titulo,
      tipo: votacao.tipo,
      encerrada: votacao.encerrada || reuniaoFechada(acesso.estado),
      createdAt: votacao.createdAt,
      totalVotos: votacao._count.votos,
      votei: votacao.votos.length > 0,
    }));
  },

  async getById(userId: number, role: Role, votacaoId: number) {
    const votacao = await carregar(votacaoId);
    const acesso = await acessoDaReuniao(userId, role, votacao.reuniaoId);
    return apresentar(votacao, userId, acesso);
  },

  async create(
    userId: number,
    role: Role,
    reuniaoId: number,
    data: VotacaoInput,
  ) {
    const acesso = await acessoDaReuniao(userId, role, reuniaoId);
    if (!acesso.podeGerir) {
      throw new AppError(403, 'Você não pode criar uma votação nesta reunião.');
    }
    if (reuniaoFechada(acesso.estado)) {
      throw new AppError(
        409,
        'Esta reunião já terminou ou foi cancelada; não é possível criar votação.',
      );
    }
    const criada = await prisma.votacao.create({
      data: {
        reuniaoId,
        titulo: data.titulo,
        tipo: data.tipo,
        mostrarParcial: data.mostrarParcial,
        permiteTrocaVoto: data.permiteTrocaVoto,
        criadoPorUserId: userId,
        opcoes: {
          create: data.opcoes.map((texto, ordem) => ({ texto, ordem })),
        },
      },
      select: { id: true },
    });
    return this.getById(userId, role, criada.id);
  },

  async vote(userId: number, role: Role, votacaoId: number, voto: VotoInput) {
    const votacao = await carregar(votacaoId);
    const acesso = await acessoDaReuniao(userId, role, votacao.reuniaoId);
    if (!acesso.participa) {
      throw new AppError(403, 'Só participantes da reunião podem votar.');
    }
    if (votacao.encerrada || reuniaoFechada(acesso.estado)) {
      throw new AppError(410, MENSAGEM_ENCERRADA);
    }
    assertPodeVotar(acesso);

    const opcaoId = voto.nulo ? null : (voto.opcaoId ?? null);
    if (
      opcaoId !== null &&
      !votacao.opcoes.some((opcao) => opcao.id === opcaoId)
    ) {
      throw new AppError(400, 'Essa opção não pertence à votação.');
    }

    await prisma.$transaction(async (transaction) => {
      // Relê dentro da transação: o encerramento pode ter acontecido agora.
      const atual = await transaction.votacao.findUnique({
        where: { id: votacaoId },
        select: { encerrada: true },
      });
      if (!atual) {
        throw new AppError(404, 'Votação não encontrada.');
      }
      if (atual.encerrada) {
        throw new AppError(410, MENSAGEM_ENCERRADA);
      }
      if (votacao.permiteTrocaVoto) {
        await transaction.votacaoVoto.upsert({
          where: { votacaoId_userId: { votacaoId, userId } },
          create: { votacaoId, opcaoId, userId },
          update: { opcaoId },
        });
        return;
      }
      try {
        await transaction.votacaoVoto.create({
          data: { votacaoId, opcaoId, userId },
        });
      } catch (error) {
        // A chave única (votação + pessoa) decide quando dois votos chegam juntos.
        if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
          throw new AppError(409, MENSAGEM_SEM_TROCA);
        }
        throw error;
      }
    });

    return this.getById(userId, role, votacaoId);
  },

  async close(userId: number, role: Role, votacaoId: number) {
    const votacao = await carregar(votacaoId);
    const acesso = await acessoDaReuniao(userId, role, votacao.reuniaoId);
    if (!acesso.podeGerir) {
      throw new AppError(403, 'Você não pode encerrar esta votação.');
    }
    await prisma.votacao.update({
      where: { id: votacaoId },
      data: { encerrada: true },
    });
    return this.getById(userId, role, votacaoId);
  },

  async delete(userId: number, role: Role, votacaoId: number) {
    const votacao = await carregar(votacaoId);
    const acesso = await acessoDaReuniao(userId, role, votacao.reuniaoId);
    if (!acesso.podeGerir) {
      throw new AppError(403, 'Você não pode excluir esta votação.');
    }
    await prisma.votacao.delete({ where: { id: votacaoId } });
  },

  // Placar oficial. Só depois do horário de fim: antes disso o número na tela
  // é o parcial, quando a votação permite. Secreta nunca traz quem votou.
  async relatorio(userId: number, role: Role, reuniaoId: number) {
    const acesso = await acessoDaReuniao(userId, role, reuniaoId);
    if (acesso.estado !== 'ENCERRADA') {
      throw new AppError(
        409,
        'O relatório fica disponível quando a reunião termina.',
      );
    }
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: {
        id: true,
        titulo: true,
        data: true,
        horaInicio: true,
        horaFim: true,
        comissao: { select: { nome: true } },
      },
    });
    if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
    const votacoes = await prisma.votacao.findMany({
      where: { reuniaoId },
      orderBy: { createdAt: 'asc' },
      select: votacaoSelect,
    });
    return {
      reuniao: {
        id: reuniao.id,
        titulo: reuniao.titulo,
        comissao: reuniao.comissao.nome,
        data: reuniao.data,
        horaInicio: reuniao.horaInicio,
        horaFim: reuniao.horaFim,
      },
      votacoes: votacoes.map((item) => apresentar(item, userId, acesso)),
    };
  },
};
