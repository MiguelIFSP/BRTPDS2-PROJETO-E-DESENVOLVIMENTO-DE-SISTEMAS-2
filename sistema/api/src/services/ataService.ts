import type { PapelComissao, Prisma, StatusAtaVoto } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import { sanitizeAtaHtml, validateAtaHtml } from '../utils/ataHtml.ts';

const podeEditar = (papel: PapelComissao) =>
  papel === 'ADMINISTRADOR' || papel === 'SECRETARIO';

const loadAccess = async (
  database: Prisma.TransactionClient,
  userId: number,
  reuniaoId: number,
) => {
  const reuniao = await database.reuniao.findUnique({
    where: { id: reuniaoId },
    select: {
      id: true,
      titulo: true,
      data: true,
      conteudoAta: true,
      versaoAta: true,
      comissao: {
        select: {
          equipe: { where: { userId }, select: { papel: true } },
        },
      },
      registros: { where: { userId }, select: { id: true } },
    },
  });
  if (!reuniao) throw new AppError(404, 'Reunião não encontrada.');
  const papel = reuniao.comissao.equipe[0]?.papel;
  if (!papel || reuniao.registros.length === 0) {
    throw new AppError(
      403,
      'A ata está disponível somente para integrantes da comissão com entrada registrada nesta reunião.',
    );
  }
  return { reuniao, papel };
};

const assertEditor = (papel: PapelComissao) => {
  if (!podeEditar(papel)) {
    throw new AppError(
      403,
      'Somente administrador ou secretário da comissão pode editar a ata.',
    );
  }
};

const conflict = () =>
  new AppError(
    409,
    'A ata foi alterada. Atualize a tela antes de salvar ou votar.',
  );

const present = async (
  database: Prisma.TransactionClient,
  userId: number,
  reuniaoId: number,
) => {
  const { reuniao, papel } = await loadAccess(database, userId, reuniaoId);
  const votos = await database.ataVoto.findMany({
    where: { reuniaoId, versaoAta: reuniao.versaoAta },
    select: { userId: true, status: true },
  });
  return {
    reuniaoId,
    titulo: reuniao.titulo,
    dataReuniao: reuniao.data,
    conteudoAta: reuniao.conteudoAta
      ? sanitizeAtaHtml(reuniao.conteudoAta)
      : null,
    versaoAta: reuniao.versaoAta,
    papelNaComissao: papel,
    podeEditar: podeEditar(papel),
    podeVotar: Boolean(reuniao.conteudoAta),
    meuVoto: votos.find((voto) => voto.userId === userId)?.status ?? null,
    votos: {
      aprovados: votos.filter((voto) => voto.status === 'APROVADO').length,
      reprovados: votos.filter((voto) => voto.status === 'REPROVADO').length,
    },
  };
};

export const ataService = {
  async assertCanEdit(userId: number, reuniaoId: number) {
    const { papel } = await loadAccess(prisma, userId, reuniaoId);
    assertEditor(papel);
  },

  getByReuniao(userId: number, reuniaoId: number) {
    return prisma.$transaction((transaction) =>
      present(transaction, userId, reuniaoId),
    );
  },

  async save(
    userId: number,
    reuniaoId: number,
    conteudoAta: string,
    versaoAta: number,
  ) {
    const sanitized = validateAtaHtml(conteudoAta);
    return prisma.$transaction(async (transaction) => {
      const { reuniao, papel } = await loadAccess(
        transaction,
        userId,
        reuniaoId,
      );
      assertEditor(papel);
      if (reuniao.versaoAta !== versaoAta) throw conflict();
      const changed = reuniao.conteudoAta !== sanitized;
      // A escrita condicional também bloqueia a linha até votos e texto ficarem consistentes.
      const updated = await transaction.reuniao.updateMany({
        where: { id: reuniaoId, versaoAta },
        data: {
          conteudoAta: sanitized,
          versaoAta: { increment: changed ? 1 : 0 },
        },
      });
      if (updated.count === 0) throw conflict();
      if (changed)
        await transaction.ataVoto.deleteMany({ where: { reuniaoId } });
      return present(transaction, userId, reuniaoId);
    });
  },

  vote(
    userId: number,
    reuniaoId: number,
    status: StatusAtaVoto,
    versaoAta: number,
  ) {
    return prisma.$transaction(async (transaction) => {
      const { reuniao } = await loadAccess(transaction, userId, reuniaoId);
      if (!reuniao.conteudoAta)
        throw new AppError(
          409,
          'A ata precisa ser redigida e salva antes da votação.',
        );
      if (reuniao.versaoAta !== versaoAta) throw conflict();
      // Serializa o voto com a edição: nunca registra aprovação de uma versão antiga.
      const locked = await transaction.reuniao.updateMany({
        where: { id: reuniaoId, versaoAta },
        data: { versaoAta: { increment: 0 } },
      });
      if (locked.count === 0) throw conflict();
      await transaction.ataVoto.upsert({
        where: { reuniaoId_userId: { reuniaoId, userId } },
        create: { reuniaoId, userId, status, versaoAta },
        update: { status, versaoAta },
      });
      return present(transaction, userId, reuniaoId);
    });
  },
};
