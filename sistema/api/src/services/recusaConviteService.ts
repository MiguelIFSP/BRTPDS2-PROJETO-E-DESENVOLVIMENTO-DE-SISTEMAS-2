import { StatusConviteReuniao, StatusMarcacaoPresenca } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';

/**
 * Quem já foi marcado como presente, ou tem saída ou retorno registrado na
 * lista de presença, participou da reunião e não pode mais recusar o convite.
 * Só ausência ou observação não bloqueiam.
 */
export const assertRecusaSemPresenca = async (
  userId: number,
  inviteId: number,
  status: StatusConviteReuniao,
) => {
  if (status !== StatusConviteReuniao.RECUSADO) return;
  // Só o próprio convite ainda não recusado: os demais casos seguem para as
  // validações da resposta (dono do convite, repetição da mesma resposta).
  const reunioes = await prisma.reuniao.findMany({
    where: {
      convites: {
        some: {
          id: inviteId,
          userId,
          status: { not: StatusConviteReuniao.RECUSADO },
        },
      },
      OR: [
        {
          presencasManuais: {
            some: { userId, status: StatusMarcacaoPresenca.PRESENTE },
          },
        },
        { eventosPresenca: { some: { userId } } },
      ],
    },
    select: { id: true },
    take: 1,
  });
  if (reunioes?.length) {
    throw new AppError(
      409,
      'Sua presença já consta na lista desta reunião; o convite não pode mais ser recusado.',
    );
  }
};
