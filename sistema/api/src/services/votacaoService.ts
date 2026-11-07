import { StatusConviteReuniao, type Role } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import type { VotacaoInput } from '../schemas/votacaoSchema.ts';

type AcessoReuniao = {
  podeGerir: boolean;
  podeVotar: boolean;
};

// Quem criou a reunião e o admin da plataforma gerenciam. Participante
// (criador ou convite aceito) vota. Os nomes de quem votou só saem para quem gerencia.
const acessoDaReuniao = async (
  userId: number,
  role: Role,
  reuniaoId: number,
): Promise<AcessoReuniao> => {
  const reuniao = await prisma.reuniao.findUnique({
    where: { id: reuniaoId },
    select: {
      criadoPorUserId: true,
      convites: {
        where: { userId, status: StatusConviteReuniao.ACEITO },
        select: { id: true },
      },
    },
  });
  if (!reuniao) {
    throw new AppError(404, 'Reunião não encontrada.');
  }
  const participa =
    reuniao.criadoPorUserId === userId || reuniao.convites.length > 0;
  if (role !== 'ADMIN' && !participa) {
    throw new AppError(403, 'Você não pode ver esta reunião.');
  }
  return {
    podeGerir: role === 'ADMIN' || reuniao.criadoPorUserId === userId,
    podeVotar: participa,
  };
};

const votacaoSelect = {
  id: true,
  reuniaoId: true,
  titulo: true,
  encerrada: true,
  createdAt: true,
  reuniao: { select: { id: true, titulo: true } },
  opcoes: {
    orderBy: { ordem: 'asc' as const },
    select: {
      id: true,
      texto: true,
      votos: {
        select: {
          userId: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { user: { name: 'asc' as const } },
      },
    },
  },
};

type VotacaoRow = {
  id: number;
  reuniaoId: number;
  titulo: string;
  encerrada: boolean;
  createdAt: Date;
  reuniao: { id: number; titulo: string };
  opcoes: {
    id: number;
    texto: string;
    votos: { userId: number; user: { id: number; name: string } }[];
  }[];
};

const apresentar = (
  votacao: VotacaoRow,
  userId: number,
  podeGerir: boolean,
) => {
  const meuVoto = votacao.opcoes.find((opcao) =>
    opcao.votos.some((voto) => voto.userId === userId),
  );
  return {
    id: votacao.id,
    reuniaoId: votacao.reuniaoId,
    titulo: votacao.titulo,
    encerrada: votacao.encerrada,
    createdAt: votacao.createdAt,
    reuniao: votacao.reuniao,
    podeGerir,
    meuVotoOpcaoId: meuVoto?.id ?? null,
    opcoes: votacao.opcoes.map((opcao) => ({
      id: opcao.id,
      texto: opcao.texto,
      votos: opcao.votos.length,
      ...(podeGerir
        ? {
            votantes: opcao.votos.map((voto) => ({
              userId: voto.user.id,
              nome: voto.user.name,
            })),
          }
        : {}),
    })),
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

export const votacaoService = {
  async listByReuniao(userId: number, role: Role, reuniaoId: number) {
    await acessoDaReuniao(userId, role, reuniaoId);
    const votacoes = await prisma.votacao.findMany({
      where: { reuniaoId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titulo: true,
        encerrada: true,
        createdAt: true,
        _count: { select: { votos: true } },
        votos: { where: { userId }, select: { id: true } },
      },
    });
    return votacoes.map((votacao) => ({
      id: votacao.id,
      titulo: votacao.titulo,
      encerrada: votacao.encerrada,
      createdAt: votacao.createdAt,
      totalVotos: votacao._count.votos,
      votei: votacao.votos.length > 0,
    }));
  },

  async getById(userId: number, role: Role, votacaoId: number) {
    const votacao = await carregar(votacaoId);
    const acesso = await acessoDaReuniao(userId, role, votacao.reuniaoId);
    return {
      ...apresentar(votacao, userId, acesso.podeGerir),
      podeVotar: acesso.podeVotar && !votacao.encerrada,
    };
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
    const criada = await prisma.votacao.create({
      data: {
        reuniaoId,
        titulo: data.titulo,
        criadoPorUserId: userId,
        opcoes: {
          create: data.opcoes.map((texto, ordem) => ({ texto, ordem })),
        },
      },
      select: { id: true },
    });
    return this.getById(userId, role, criada.id);
  },

  async vote(userId: number, role: Role, votacaoId: number, opcaoId: number) {
    const votacao = await carregar(votacaoId);
    const acesso = await acessoDaReuniao(userId, role, votacao.reuniaoId);
    if (!acesso.podeVotar) {
      throw new AppError(403, 'Só participantes da reunião podem votar.');
    }

    await prisma.$transaction(async (transaction) => {
      const atual = await transaction.votacao.findUnique({
        where: { id: votacaoId },
        select: { encerrada: true },
      });
      if (!atual) {
        throw new AppError(404, 'Votação não encontrada.');
      }
      if (atual.encerrada) {
        throw new AppError(409, 'Esta votação já foi encerrada.');
      }
      const opcao = await transaction.votacaoOpcao.findFirst({
        where: { id: opcaoId, votacaoId },
        select: { id: true },
      });
      if (!opcao) {
        throw new AppError(400, 'Essa opção não pertence à votação.');
      }
      await transaction.votacaoVoto.upsert({
        where: { votacaoId_userId: { votacaoId, userId } },
        create: { votacaoId, opcaoId, userId },
        update: { opcaoId },
      });
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
};
