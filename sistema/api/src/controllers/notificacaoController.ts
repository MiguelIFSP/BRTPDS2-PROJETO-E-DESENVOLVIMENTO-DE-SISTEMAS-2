import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import { notificacaoService } from '../services/notificacaoService.ts';
import { parseId } from '../utils/parseId.ts';

export const notificacaoController = {
  async listMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const notificacoes = await notificacaoService.listMine(userId);
    response.status(200).json(notificacoes);
  },

  async markAllRead(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const result = await notificacaoService.markAllRead(userId);
    response.status(200).json(result);
  },

  async remove(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const notificacaoId = parseId(request.params.id, 'da notificação');
    await notificacaoService.remove(userId, notificacaoId);
    response.status(200).json({ message: 'Notificação removida.' });
  },

  async removeAll(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const result = await notificacaoService.removeAll(userId);
    response.status(200).json(result);
  },
};
