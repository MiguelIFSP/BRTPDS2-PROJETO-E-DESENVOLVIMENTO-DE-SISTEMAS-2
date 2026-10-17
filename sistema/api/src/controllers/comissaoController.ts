import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  comissaoSchema,
  comissaoUpdateSchema,
  membroComissaoSchema,
} from '../schemas/comissaoSchema.ts';
import { comissaoService } from '../services/comissaoService.ts';
import { parseId } from '../utils/parseId.ts';

// quem faz a requisicao vem sempre do token (requireAuth), nunca de header/body —
// antes era um header "user-id" que qualquer um podia forjar.

export const comissaoController = {
  async create(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const data = await comissaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const comissao = await comissaoService.create(userId, data);
    response.status(201).json(comissao);
  },

  async getAllByOrganizacao(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const organizacaoId = parseId(
      request.params.organizacaoId,
      'da organização',
    );
    const comissoes = await comissaoService.getAllByOrganizacao(
      organizacaoId,
      userId,
      role,
    );
    response.status(200).json(comissoes);
  },

  async getById(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const id = parseId(request.params.id, 'da comissão');
    const comissao = await comissaoService.getById(id, userId, role);
    response.status(200).json(comissao);
  },

  async update(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const id = parseId(request.params.id, 'da comissão');
    const data = await comissaoUpdateSchema.validate(request.body, {
      stripUnknown: true,
    });
    const comissao = await comissaoService.update(id, userId, data);
    response.status(200).json(comissao);
  },

  async delete(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const id = parseId(request.params.id, 'da comissão');
    await comissaoService.delete(id, userId);
    response.status(200).json({ message: 'Comissão excluída com sucesso.' });
  },

  async addMember(request: Request, response: Response) {
    const { id: requesterId } = (request as AuthenticatedRequest).user;
    const comissaoId = parseId(request.params.comissaoId, 'da comissão');
    const { userId, papel } = await membroComissaoSchema.validate(
      request.body,
      { stripUnknown: true },
    );
    const membro = await comissaoService.addMember(
      comissaoId,
      requesterId,
      userId,
      papel,
    );
    response.status(201).json(membro);
  },

  async removeMember(request: Request, response: Response) {
    const { id: requesterId } = (request as AuthenticatedRequest).user;
    const comissaoId = parseId(request.params.comissaoId, 'da comissão');
    const userId = parseId(request.params.userId, 'do membro');
    await comissaoService.removeMember(comissaoId, requesterId, userId);
    response.status(200).json({ message: 'Membro removido com sucesso.' });
  },

  /**
   * Relatório de comissões (admin): agregados sobre todas as comissões.
   */
  async getReport(_request: Request, response: Response) {
    const report = await comissaoService.getReport();
    response.status(200).json(report);
  },

  /**
   * Relatório das comissões do usuário logado (só as que ele participa).
   */
  async getReportMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const report = await comissaoService.getReportMine(userId);
    response.status(200).json(report);
  },
};
