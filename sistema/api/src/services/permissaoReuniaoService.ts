import type { Role } from '@prisma/client';
import prisma from '../config/database.ts';

type ReuniaoGerida = {
  criadoPorUserId: number | null;
  comissaoId: number;
};

/**
 * Quem gere uma reunião (editar, excluir, convidar, reenviar convite) e as
 * votações dela: o criador (se a conta ainda existir), o Administrador atual
 * da comissão e o ADMIN da plataforma. Conferido no vínculo atual.
 */
export const podeGerirReuniao = async (
  userId: number,
  role: Role,
  reuniao: ReuniaoGerida,
) => {
  if (role === 'ADMIN' || reuniao.criadoPorUserId === userId) return true;
  const vinculo = await prisma.comissaoEquipe.findUnique({
    where: {
      comissaoId_userId: { comissaoId: reuniao.comissaoId, userId },
    },
    select: { papel: true },
  });
  return vinculo?.papel === 'ADMINISTRADOR';
};
