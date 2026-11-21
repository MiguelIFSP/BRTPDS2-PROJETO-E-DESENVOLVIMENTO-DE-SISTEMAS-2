import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import { sessaoService } from '../services/sessaoService.ts';

export type AuthenticatedRequest = Request & {
  user: {
    id: number;
    role: 'USER' | 'ADMIN';
    email: string;
  };
};

const getToken = (request: Request) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7);
};

// O papel vem do perfil atual no banco (API de Dados), nunca do token: quem foi
// rebaixado ou excluído perde o acesso em até 30 s, mesmo com token válido.
export const requireAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const token = getToken(request);
  if (!token) throw new AppError(401, 'Autenticação necessária.');

  const perfil = await sessaoService.getProfile(token);
  if (!perfil) throw new AppError(401, 'Sessão inválida. Entre novamente.');

  (request as AuthenticatedRequest).user = {
    id: perfil.id,
    role: perfil.role,
    email: perfil.email,
  };
  next();
};

export const requireAdmin = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if ((request as AuthenticatedRequest).user?.role !== 'ADMIN') {
    throw new AppError(403, 'Acesso restrito ao administrador.');
  }
  next();
};
