import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

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

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const token = getToken(request);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    response.status(401).json({ error: 'Autenticação necessária.' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (typeof payload !== 'object' || !payload.sub || !payload.role || !payload.email) {
      response.status(401).json({ error: 'Token inválido.' });
      return;
    }

    (request as AuthenticatedRequest).user = {
      id: Number(payload.sub),
      role: payload.role as 'USER' | 'ADMIN',
      email: String(payload.email),
    };
    next();
  } catch {
    response.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const requireAdmin = (request: Request, response: Response, next: NextFunction) => {
  if ((request as AuthenticatedRequest).user?.role !== 'ADMIN') {
    response.status(403).json({ error: 'Acesso restrito ao administrador.' });
    return;
  }

  next();
};