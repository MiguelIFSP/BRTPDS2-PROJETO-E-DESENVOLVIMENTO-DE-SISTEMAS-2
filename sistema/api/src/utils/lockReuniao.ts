import type { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.ts';

/** Deve ser a primeira leitura da transação: serializa presença, voto e finalização. */
export const lockReuniao = async (
  transaction: Prisma.TransactionClient,
  reuniaoId: number,
) => {
  const rows = await transaction.$queryRaw<{ id: number }[]>`
    SELECT id FROM Reuniao WHERE id = ${reuniaoId} FOR UPDATE
  `;
  if (rows.length === 0) throw new AppError(404, 'Reunião não encontrada.');
};
