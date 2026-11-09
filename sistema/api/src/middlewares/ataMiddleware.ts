import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from './authMiddleware.ts';
import { ataService } from '../services/ataService.ts';
import { parseId } from '../utils/parseId.ts';

export const requireAtaEditor = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const { id: userId } = (request as AuthenticatedRequest).user;
  await ataService.assertCanEdit(
    userId,
    parseId(request.params.id, 'da reunião'),
  );
  next();
};
