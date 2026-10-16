import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { parseId } from '../utils/parseId.ts';

export type AuthenticatedUser = {
  id: number;
  role: Role;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

const ROLES: readonly string[] = Object.values(Role);

const getToken = (request: Request) => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return null;
  return authorization.slice(7);
};

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && ROLES.includes(value);

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError(401, 'Token inválido ou expirado.');
  }
};

export const requireAuth = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const token = getToken(request);
  if (!token) {
    throw new AppError(401, 'Autenticação necessária.');
  }

  const payload = verifyToken(token);
  if (
    typeof payload !== 'object' ||
    !payload.sub ||
    !isRole(payload.role) ||
    !payload.email
  ) {
    throw new AppError(401, 'Token inválido.');
  }

  (request as AuthenticatedRequest).user = {
    id: Number(payload.sub),
    role: payload.role,
    email: String(payload.email),
  };
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

// Garante que /usuarios/:id/... só seja usado pelo próprio dono da conta.
// Id malformado = 400 (parseId); id de outra pessoa = 403.
export const requireSelf = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const userId = parseId(request.params.id, 'do usuário');
  if (userId !== (request as AuthenticatedRequest).user.id) {
    throw new AppError(403, 'Você só pode alterar a sua própria conta.');
  }
  next();
};
