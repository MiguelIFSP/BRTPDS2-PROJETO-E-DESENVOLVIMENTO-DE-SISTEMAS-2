import type { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import { AppError } from '../errors/AppError.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';

// Precisa dos 4 parâmetros para o Express reconhecer como middleware de erro.
export const handleError = (
  error: unknown,
  request: Request,
  response: Response,
  _next: NextFunction,
) => {
  if (error instanceof yup.ValidationError) {
    response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
    return;
  }
  if (error instanceof AppError) {
    response
      .status(error.statusCode)
      .json({ ...error.details, error: error.message });
    return;
  }
  // corpo da requisição com JSON malformado (lançado pelo express.json())
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'JSON inválido.' });
    return;
  }
  // rede de segurança para erros do Prisma que o service não converteu (PR-03)
  if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
    response.status(404).json({ error: 'Registro não encontrado.' });
    return;
  }
  if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
    response.status(409).json({ error: 'Registro já existente.' });
    return;
  }
  console.error(`Erro em ${request.method} ${request.originalUrl}:`, error);
  response
    .status(500)
    .json({ error: 'Erro interno. Tente novamente mais tarde.' });
};
