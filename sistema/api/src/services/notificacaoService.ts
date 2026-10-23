import type { Prisma } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';

// O sino mostra só os avisos recentes; os antigos continuam no banco.
const LIMITE_NOTIFICACOES = 50;

const notificacaoSelect = {
  id: true,
  tipo: true,
  titulo: true,
  mensagem: true,
  reuniaoId: true,
  lidaAt: true,
  createdAt: true,
} satisfies Prisma.NotificacaoSelect;

export const notificacaoService = {
  listMine(userId: number) {
    return prisma.notificacao.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: LIMITE_NOTIFICACOES,
      select: notificacaoSelect,
    });
  },

  async markAllRead(userId: number) {
    const { count } = await prisma.notificacao.updateMany({
      where: { userId, lidaAt: null },
      data: { lidaAt: new Date() },
    });
    return { lidas: count };
  },

  // O filtro por userId impede apagar a notificação de outra pessoa: para ela,
  // o id simplesmente não existe.
  async remove(userId: number, notificacaoId: number) {
    const { count } = await prisma.notificacao.deleteMany({
      where: { id: notificacaoId, userId },
    });
    if (count === 0) {
      throw new AppError(404, 'Notificação não encontrada.');
    }
  },

  async removeAll(userId: number) {
    const { count } = await prisma.notificacao.deleteMany({
      where: { userId },
    });
    return { removidas: count };
  },
};
