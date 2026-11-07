import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import { votacaoSchema, votoSchema } from '../schemas/votacaoSchema.ts';
import { votacaoService } from '../services/votacaoService.ts';
import { parseId } from '../utils/parseId.ts';

export const votacaoController = {
  async listByReuniao(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const votacoes = await votacaoService.listByReuniao(
      userId,
      role,
      reuniaoId,
    );
    response.status(200).json(votacoes);
  },

  async create(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const data = await votacaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const votacao = await votacaoService.create(userId, role, reuniaoId, data);
    response.status(201).json(votacao);
  },

  async getById(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const votacaoId = parseId(request.params.id, 'da votação');
    const votacao = await votacaoService.getById(userId, role, votacaoId);
    response.status(200).json(votacao);
  },

  async vote(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const votacaoId = parseId(request.params.id, 'da votação');
    const { opcaoId } = await votoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const votacao = await votacaoService.vote(userId, role, votacaoId, opcaoId);
    response.status(200).json(votacao);
  },

  async close(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const votacaoId = parseId(request.params.id, 'da votação');
    const votacao = await votacaoService.close(userId, role, votacaoId);
    response.status(200).json(votacao);
  },

  async delete(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const votacaoId = parseId(request.params.id, 'da votação');
    await votacaoService.delete(userId, role, votacaoId);
    response.status(200).json({ message: 'Votação removida.' });
  },
};
