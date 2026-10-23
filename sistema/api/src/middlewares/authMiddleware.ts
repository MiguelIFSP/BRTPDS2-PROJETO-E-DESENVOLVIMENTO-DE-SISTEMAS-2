import { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.ts';
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

// O token comprova quem é a pessoa; o perfil (role) é lido do banco a cada
// requisição. O token vale 7 dias, e sem essa leitura quem fosse rebaixado
// continuaria administrador (e quem fosse promovido não seria) até ele vencer.
export const requireAuth = async (
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

  const id = Number(payload.sub);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(401, 'Token inválido.');
  }
  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true, email: true },
  });
  // conta excluída depois do login: o token continua assinado, mas não vale mais.
  if (!user) {
    throw new AppError(401, 'Sessão inválida. Entre novamente.');
  }

  (request as AuthenticatedRequest).user = {
    id,
    role: user.role,
    email: user.email,
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
