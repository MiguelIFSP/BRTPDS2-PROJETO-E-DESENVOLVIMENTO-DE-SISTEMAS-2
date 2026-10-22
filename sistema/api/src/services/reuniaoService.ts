import { StatusConviteReuniao, type Prisma } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';

type CreateReuniaoData = {
  comissaoId: number;
  titulo: string;
  pauta: string;
  descricao?: string | undefined;
  data: string;
  horaInicio: string;
  horaFim: string;
};

const reuniaoSelect = {
  id: true,
  comissaoId: true,
  titulo: true,
  pauta: true,
  descricao: true,
  data: true,
  horaInicio: true,
  horaFim: true,
  status: true,
  criadoPorUserId: true,
  comissao: { select: { id: true, nome: true } },
  convites: { select: { id: true, status: true } },
} satisfies Prisma.ReuniaoSelect;

const conviteSelect = {
  id: true,
  reuniaoId: true,
  status: true,
  reuniao: {
    select: {
      titulo: true,
      pauta: true,
      descricao: true,
      data: true,
      horaInicio: true,
      horaFim: true,
      comissao: { select: { nome: true } },
      criadoPor: { select: { name: true } },
    },
  },
} satisfies Prisma.ConviteReuniaoSelect;

const assertMembroDaComissao = async (comissaoId: number, userId: number) => {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: {
      id: true,
      organizacao: { select: { status: true } },
      equipe: { select: { userId: true } },
    },
  });

  if (!comissao) {
    throw new AppError(404, 'Comissão não encontrada.');
  }
  if (comissao.organizacao.status !== 'ACEITA') {
    throw new AppError(
      409,
      'A organização da comissão ainda não foi aprovada.',
    );
  }
  if (!comissao.equipe.some((membro) => membro.userId === userId)) {
    throw new AppError(403, 'Você não é membro desta comissão.');
  }
  return comissao;
};

export const reuniaoService = {
  async listMine(userId: number) {
    const reunioes = await prisma.reuniao.findMany({
      where: { comissao: { equipe: { some: { userId } } } },
      orderBy: [{ data: 'asc' }, { horaInicio: 'asc' }],
      select: {
        ...reuniaoSelect,
        registros: { where: { userId } },
      },
    });
    return reunioes.map(({ registros, ...reuniao }) => ({
      ...reuniao,
      meuRegistro: registros[0] ?? null,
    }));
  },

  async checkIn(userId: number, reuniaoId: number) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: { comissaoId: true, status: true },
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }

    await assertMembroDaComissao(reuniao.comissaoId, userId);

    const where = { reuniaoId_userId: { reuniaoId, userId } };
    const existente = await prisma.reuniaoRegistro.findUnique({ where });
    // Uma repetição confirma a primeira entrada, mesmo após o encerramento.
    if (existente) return { registro: existente, jaRegistrado: true };

    if (reuniao.status !== 'AGENDADA') {
      throw new AppError(409, 'Esta reunião não está disponível para entrada.');
    }

    try {
      // O banco gera entradaAt: o cliente não controla o horário da presença.
      const registro = await prisma.reuniaoRegistro.create({
        data: { reuniaoId, userId },
      });
      return { registro, jaRegistrado: false };
    } catch (error) {
      // Duas requisições podem consultar antes da primeira gravação. A chave
      // única decide qual cria; a outra devolve o mesmo registro sem alterá-lo.
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
        const registro = await prisma.reuniaoRegistro.findUnique({ where });
        if (registro) return { registro, jaRegistrado: true };
      }
      throw error;
    }
  },

  async checkOut(userId: number, reuniaoId: number) {
    const reuniao = await prisma.reuniao.findUnique({
      where: { id: reuniaoId },
      select: { comissaoId: true },
    });
    if (!reuniao) {
      throw new AppError(404, 'Reunião não encontrada.');
    }

    await assertMembroDaComissao(reuniao.comissaoId, userId);

    const where = { reuniaoId_userId: { reuniaoId, userId } };
    const existente = await prisma.reuniaoRegistro.findUnique({ where });
    if (!existente) {
      throw new AppError(409, 'Registre sua entrada antes de sair da reunião.');
    }
    if (existente.saidaAt) {
      return { registro: existente, jaRegistrado: true };
    }

    const atualizado = await prisma.reuniaoRegistro.updateMany({
      where: { reuniaoId, userId, saidaAt: null },
      data: { saidaAt: new Date() },
    });
    const registro = await prisma.reuniaoRegistro.findUnique({ where });
    if (!registro) {
      throw new AppError(404, 'Registro de presença não encontrado.');
    }

    return { registro, jaRegistrado: atualizado.count === 0 };
  },

  async listPendingInvites(userId: number) {
    const convites = await prisma.conviteReuniao.findMany({
      where: { userId, status: StatusConviteReuniao.PENDENTE },
      orderBy: { createdAt: 'desc' },
      select: conviteSelect,
    });

    return convites.map((convite) => ({
      id: convite.id,
      reuniaoId: convite.reuniaoId,
      titulo: convite.reuniao.titulo,
      data: convite.reuniao.data,
      horaInicio: convite.reuniao.horaInicio,
      horaFim: convite.reuniao.horaFim,
      usuario: convite.reuniao.criadoPor.name,
      status: convite.status,
      pauta: convite.reuniao.pauta,
      descricao: convite.reuniao.descricao,
      comissao: convite.reuniao.comissao.nome,
    }));
  },

  async create(userId: number, data: CreateReuniaoData) {
    const comissao = await assertMembroDaComissao(data.comissaoId, userId);
    const userIds = comissao.equipe
      .map((membro) => membro.userId)
      .filter((membroId) => membroId !== userId);

    return prisma.$transaction(async (transaction) => {
      try {
        return await transaction.reuniao.create({
          data: {
            comissaoId: data.comissaoId,
            titulo: data.titulo,
            pauta: data.pauta,
            descricao: data.descricao || null,
            data: data.data,
            horaInicio: data.horaInicio,
            horaFim: data.horaFim,
            criadoPorUserId: userId,
            convites: {
              create: userIds.map((membroId) => ({ userId: membroId })),
            },
          },
          select: reuniaoSelect,
        });
      } catch (error) {
        if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
          throw new AppError(404, 'Comissão não encontrada.');
        }
        throw error;
      }
    });
  },

  async respondInvite(
    userId: number,
    inviteId: number,
    status: StatusConviteReuniao,
  ) {
    const convite = await prisma.conviteReuniao.findUnique({
      where: { id: inviteId },
      select: {
        userId: true,
        status: true,
        reuniao: { select: { status: true } },
      },
    });

    if (!convite) {
      throw new AppError(404, 'Convite não encontrado.');
    }
    if (convite.userId !== userId) {
      throw new AppError(403, 'Você não pode responder a este convite.');
    }
    if (convite.reuniao.status === 'CANCELADA') {
      throw new AppError(
        409,
        'Não é possível responder a um convite cancelado.',
      );
    }
    if (convite.status !== StatusConviteReuniao.PENDENTE) {
      throw new AppError(409, 'Este convite já foi respondido.');
    }

    try {
      const atualizado = await prisma.conviteReuniao.update({
        where: { id: inviteId },
        data: { status, respondidoAt: new Date() },
        select: conviteSelect,
      });

      return {
        id: atualizado.id,
        reuniaoId: atualizado.reuniaoId,
        titulo: atualizado.reuniao.titulo,
        data: atualizado.reuniao.data,
        horaInicio: atualizado.reuniao.horaInicio,
        horaFim: atualizado.reuniao.horaFim,
        usuario: atualizado.reuniao.criadoPor.name,
        status: atualizado.status,
        pauta: atualizado.reuniao.pauta,
        descricao: atualizado.reuniao.descricao,
        comissao: atualizado.reuniao.comissao.nome,
      };
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Convite não encontrado.');
      }
      throw error;
    }
  },
};
