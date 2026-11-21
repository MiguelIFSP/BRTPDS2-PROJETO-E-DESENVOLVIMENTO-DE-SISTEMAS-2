import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import { sessaoService, type Role } from '../services/sessaoService.ts';
import { hasValidApiKey } from './apiKeyMiddleware.ts';

export type AuthenticatedUser = {
  id: number;
  role: Role;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

const getToken = (request: Request) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7);
};

// O papel vem do perfil atual da API de Dados (contrato C2), não de um token
// assinado antes: o rebaixamento vale em até 30 s.
const authenticate = async (request: Request) => {
  const token = getToken(request);
  if (!token) {
    throw new AppError(401, 'Autenticação necessária.');
  }

  const perfil = await sessaoService.getProfile(token);
  if (!perfil) {
    throw new AppError(401, 'Sessão inválida. Entre novamente.');
  }

  (request as AuthenticatedRequest).user = {
    id: perfil.id,
    role: perfil.role,
    email: perfil.email,
  };
};

export const requireAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  await authenticate(request);
  next();
};

// Usada só na checagem sob demanda: app e painel ainda podem chamar com a
// chave interna até migrarem para o token do usuário.
export const requireAuthOrApiKey = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if (!hasValidApiKey(request)) {
    await authenticate(request);
  }
  next();
};

export const requireAdmin = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if ((request as AuthenticatedRequest).user.role !== 'ADMIN') {
    throw new AppError(403, 'Acesso restrito ao administrador.');
  }
  next();
};
