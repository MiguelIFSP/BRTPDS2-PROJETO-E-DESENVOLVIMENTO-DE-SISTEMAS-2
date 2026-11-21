import type { Role } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import { auth } from '../lib/auth.ts';
import { parseId } from '../utils/parseId.ts';

export type AuthenticatedUser = {
  id: number;
  role: Role;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};

// Credencial enviada pelo cliente: app e serviços mandam Authorization: Bearer;
// o navegador manda o cookie de sessão.
const temCredencial = (request: Request) =>
  Boolean(request.headers.authorization || request.headers.cookie);

// A sessão comprova quem é a pessoa; o perfil (role) é lido do banco a cada
// requisição, sem cache. Sem essa leitura, quem fosse rebaixado continuaria
// administrador até a sessão vencer.
export const requireAuth = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  if (!temCredencial(request)) {
    throw new AppError(401, 'Autenticação necessária.');
  }

  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });
  const id = Number(session?.user.id);
  if (!session || !Number.isInteger(id) || id <= 0) {
    throw new AppError(401, 'Sessão inválida. Entre novamente.');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { role: true, email: true },
  });
  // conta excluída depois do login: a sessão some junto, mas a checagem
  // protege contra a leitura de uma sessão em trânsito.
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
