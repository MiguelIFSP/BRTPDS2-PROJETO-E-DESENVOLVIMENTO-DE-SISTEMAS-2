import { ValidationError } from 'yup';

import { AppError } from '../errors/AppError.ts';
import { listaPresencaSchema } from '../schemas/listaPresencaSchema.ts';
import type { ListaPresencaConsolidada } from '../types/listaPresenca.ts';
import type { MarcacaoPresenca } from '../types/marcacaoPresenca.ts';

function normalizeMarcacoes(marcacoes: MarcacaoPresenca[]): MarcacaoPresenca[] {
  try {
    const { presencas } = listaPresencaSchema.validateSync(
      { presencas: marcacoes },
      { stripUnknown: true },
    );

    return presencas.map(({ usuarioId, status, observacao }) => ({
      usuarioId,
      status,
      ...(observacao ? { observacao } : {}),
    }));
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new AppError(
        409,
        error.errors[0] ?? 'As marcações de presença são inválidas.',
      );
    }
    throw error;
  }
}

/**
 * Mescla marcações por pessoa sem alterar o snapshot consolidado. O chamador
 * continua responsável por autenticação, autorização e persistência da versão.
 */
export function applyMarcacoesPresenca(
  snapshot: ListaPresencaConsolidada,
  anteriores: MarcacaoPresenca[],
  novas: MarcacaoPresenca[],
): MarcacaoPresenca[] {
  if (!snapshot || !Array.isArray(snapshot.membros)) {
    throw new AppError(409, 'A lista de presença de origem é inválida.');
  }

  const membrosIds = new Set<number>();
  for (const membro of snapshot.membros) {
    if (
      !membro ||
      !Number.isSafeInteger(membro.userId) ||
      membro.userId <= 0 ||
      membrosIds.has(membro.userId)
    ) {
      throw new AppError(409, 'As pessoas da lista de origem são inválidas.');
    }
    membrosIds.add(membro.userId);
  }

  // Validar ambos os lotes antes da mesclagem impede aplicação parcial.
  const anterioresNormalizadas = normalizeMarcacoes(anteriores);
  const novasNormalizadas = normalizeMarcacoes(novas);
  const todas = [...anterioresNormalizadas, ...novasNormalizadas];
  if (todas.some((marcacao) => !membrosIds.has(marcacao.usuarioId))) {
    throw new AppError(
      409,
      'Só é possível marcar a presença de pessoas incluídas nesta lista.',
    );
  }

  const porPessoa = new Map(
    todas.map((marcacao) => [marcacao.usuarioId, marcacao]),
  );
  return snapshot.membros.flatMap((membro) => {
    const marcacao = porPessoa.get(membro.userId);
    return marcacao ? [{ ...marcacao }] : [];
  });
}
