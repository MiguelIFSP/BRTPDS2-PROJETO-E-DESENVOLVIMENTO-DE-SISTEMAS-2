import type { NextFunction, Request, Response } from 'express';
import * as yup from 'yup';
import { AppError } from '../errors/AppError.ts';

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
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  // corpo da requisição com JSON malformado (lançado pelo express.json())
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'JSON inválido.' });
    return;
  }
  // corpo maior que o limite do express.json()
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    response
      .status(413)
      .json({ error: 'Corpo da requisição maior que o permitido.' });
    return;
  }
  // O detalhe fica só no log: a mensagem de erros internos pode revelar caminhos e nomes.
  console.error(`Erro em ${request.method} ${request.originalUrl}:`, error);
  response
    .status(500)
    .json({ error: 'Erro interno. Tente novamente mais tarde.' });
};
