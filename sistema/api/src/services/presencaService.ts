import { randomInt, timingSafeEqual } from 'node:crypto';
import { type Prisma } from '@prisma/client';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { estadoDaReuniao } from '../utils/fusoHorario.ts';
import { lockReuniao } from '../utils/lockReuniao.ts';

const presencaSelect = {
  comissaoId: true,
  criadoPorUserId: true,
  codigoPresenca: true,
  status: true,
  data: true,
  horaInicio: true,
  horaFim: true,
  ataExportadaAt: true,
  convites: { select: { userId: true, status: true } },
} satisfies Prisma.ReuniaoSelect;

const loadAccess = async (
  transaction: Prisma.TransactionClient,
  reuniaoId: number,
  actorId: number,
) => {
  const reuniao = await transaction.reuniao.findUnique({
    where: { id: reuniaoId },
    select: presencaSelect,
  });
  if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
  const comissao = await transaction.comissao.findUnique({
    where: { id: reuniao.comissaoId },
    select: {
      organizacao: { select: { status: true } },
      equipe: { select: { userId: true, papel: true } },
    },
  });
  if (!comissao) throw new AppError(404, 'Comissão não encontrada.');
  const membro = comissao.equipe.find((item) => item.userId === actorId);
  if (!membro) throw new AppError(403, 'Você não é membro desta comissão.');
  if (comissao.organizacao.status !== 'ACEITA')
    throw new AppError(
      409,
      'A organização da comissão ainda não foi aprovada.',
    );
  return { reuniao, comissao, membro };
};

const assertAdmin = (papel: string) => {
  if (papel !== 'ADMINISTRADOR')
    throw new AppError(
      403,
      'Somente o administrador da comissão pode realizar esta ação.',
    );
};

const register = (
  actorId: number,
  reuniaoId: number,
  userId: number,
  acao: 'entrada' | 'saida',
  isManual: boolean,
  codigoPresenca?: string,
) =>
  prisma.$transaction(async (transaction) => {
    await lockReuniao(transaction, reuniaoId);
    const { reuniao, comissao, membro } = await loadAccess(
      transaction,
      reuniaoId,
      actorId,
    );
    if (isManual) {
      assertAdmin(membro.papel);
      if (actorId === userId) {
        throw new AppError(
          403,
          'Para registrar sua própria presença, use o código e a confirmação pessoal.',
        );
      }
    }
    if (!comissao.equipe.some((item) => item.userId === userId))
      throw new AppError(403, 'O participante não pertence à comissão.');
    if (
      reuniao.criadoPorUserId !== userId &&
      !reuniao.convites.some(
        (item) => item.userId === userId && item.status === 'ACEITO',
      )
    ) {
      throw new AppError(
        403,
        'O participante precisa aceitar o convite da reunião.',
      );
    }
    const agora = new Date();
    const horario = estadoDaReuniao(reuniao, env.TZ_REUNIOES, agora);
    if (agora < horario.inicio)
      throw new AppError(
        400,
        'Não é possível registrar entrada/saída antes do início da reunião.',
      );
    if (reuniao.status === 'CANCELADA')
      throw new AppError(
        409,
        'Não é possível registrar presença em reunião cancelada.',
      );
    if (!isManual) {
      const esperado = Buffer.from(reuniao.codigoPresenca ?? '');
      const recebido = Buffer.from(codigoPresenca ?? '');
      if (
        !esperado.length ||
        esperado.length !== recebido.length ||
        !timingSafeEqual(esperado, recebido)
      )
        throw new AppError(
          400,
          'Código de presença inválido. Confira com o administrador da comissão.',
        );
    }
    const where = { reuniaoId_userId: { reuniaoId, userId } };
    const existente = await transaction.reuniaoRegistro.findUnique({ where });
    if (acao === 'entrada') {
      if (existente) return { registro: existente, jaRegistrado: true };
      // Novas presenças alterariam a maioria da ata já finalizada.
      if (reuniao.ataExportadaAt)
        throw new AppError(
          409,
          'A ata já foi finalizada; não é possível adicionar presenças.',
        );
      if (!isManual && (reuniao.status !== 'AGENDADA' || agora >= horario.fim))
        throw new AppError(
          409,
          'Esta reunião já terminou; solicite o registro ao administrador da comissão.',
        );
      const registro = await transaction.reuniaoRegistro.create({
        data: {
          reuniaoId,
          userId,
          entradaAt: agora,
          origemEntrada: isManual ? 'MANUAL' : 'PROPRIO',
          entradaManualPorId: isManual ? actorId : null,
        },
      });
      return { registro, jaRegistrado: false };
    }
    if (!existente)
      throw new AppError(409, 'Registre sua entrada antes de sair da reunião.');
    if (existente.saidaAt) return { registro: existente, jaRegistrado: true };
    const registro = await transaction.reuniaoRegistro.update({
      where,
      data: {
        saidaAt: agora,
        origemSaida: isManual ? 'MANUAL' : 'PROPRIO',
        saidaManualPorId: isManual ? actorId : null,
      },
    });
    return { registro, jaRegistrado: false };
  });

export const presencaService = {
  generateCode() {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  },
  async getCode(actorId: number, reuniaoId: number) {
    return prisma.$transaction(async (transaction) => {
      const { reuniao, membro } = await loadAccess(
        transaction,
        reuniaoId,
        actorId,
      );
      assertAdmin(membro.papel);
      return { codigoPresenca: reuniao.codigoPresenca };
    });
  },
  async renewCode(actorId: number, reuniaoId: number) {
    return prisma.$transaction(async (transaction) => {
      await lockReuniao(transaction, reuniaoId);
      const { reuniao, membro } = await loadAccess(
        transaction,
        reuniaoId,
        actorId,
      );
      assertAdmin(membro.papel);
      let codigoPresenca = presencaService.generateCode();
      while (codigoPresenca === reuniao.codigoPresenca)
        codigoPresenca = presencaService.generateCode();
      await transaction.reuniao.update({
        where: { id: reuniaoId },
        data: { codigoPresenca },
      });
      return { codigoPresenca };
    });
  },
  checkIn(userId: number, reuniaoId: number, codigoPresenca: string) {
    return register(
      userId,
      reuniaoId,
      userId,
      'entrada',
      false,
      codigoPresenca,
    );
  },
  checkOut(userId: number, reuniaoId: number, codigoPresenca: string) {
    return register(userId, reuniaoId, userId, 'saida', false, codigoPresenca);
  },
  registerManual(
    actorId: number,
    reuniaoId: number,
    userId: number,
    acao: 'entrada' | 'saida',
  ) {
    return register(actorId, reuniaoId, userId, acao, true);
  },
};
