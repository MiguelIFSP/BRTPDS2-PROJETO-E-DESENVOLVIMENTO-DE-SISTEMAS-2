import { AppError } from '../errors/AppError.ts';

type RouteParam = string | string[] | undefined;

// Ids de URL precisam ser inteiros positivos. Qualquer outra coisa é 400,
// antes de checar permissão ou consultar o banco.
export const parseId = (rawId: RouteParam, entidade: string): number => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, `Identificador ${entidade} inválido.`);
  }
  return id;
};
