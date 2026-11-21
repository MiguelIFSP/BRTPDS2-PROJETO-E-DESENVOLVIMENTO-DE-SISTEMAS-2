import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';

// Comparação em tempo constante via hash: evita timing attack e o throw do
// timingSafeEqual quando os buffers têm tamanhos diferentes.
const safeCompare = (a: string, b: string) =>
  timingSafeEqual(
    createHash('sha256').update(a).digest(),
    createHash('sha256').update(b).digest(),
  );

export const hasValidApiKey = (request: Request) => {
  const key = request.header('x-api-key');
  return Boolean(key) && safeCompare(key as string, env.INTERNAL_API_KEY);
};

export const requireApiKey = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if (!hasValidApiKey(request)) {
    throw new AppError(401, 'Autenticação necessária.');
  }
  next();
};
