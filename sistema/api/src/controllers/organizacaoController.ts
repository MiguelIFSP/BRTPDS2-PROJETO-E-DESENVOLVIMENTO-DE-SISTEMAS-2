import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  membroOrganizacaoSchema,
  organizacaoSchema,
  papelMembroSchema,
  statusOrganizacaoSchema,
} from '../schemas/organizacaoSchema.ts';
import { organizacaoService } from '../services/organizacaoService.ts';
import { parseId } from '../utils/parseId.ts';

// controller: valida body, chama o service, devolve json.

export const organizacaoController = {
  async create(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const { nome } = await organizacaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const organizacao = await organizacaoService.create(userId, nome);
    response.status(201).json(organizacao);
  },

  async getAll(_request: Request, response: Response) {
    const organizacoes = await organizacaoService.getAll();
    response.status(200).json(organizacoes);
  },

  async getReport(_request: Request, response: Response) {
    const report = await organizacaoService.getReport();
    response.status(200).json(report);
  },

  async getReportMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const report = await organizacaoService.getReportMine(userId);
    response.status(200).json(report);
  },

  async getMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const organizacoes = await organizacaoService.getMine(userId);
    response.status(200).json(organizacoes);
  },

  async getById(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const id = parseId(request.params.id, 'da organização');
    const organizacao = await organizacaoService.getById(id, userId, role);
    response.status(200).json(organizacao);
  },

  async update(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const id = parseId(request.params.id, 'da organização');
    const { nome } = await organizacaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const organizacao = await organizacaoService.update(id, userId, role, nome);
    response.status(200).json(organizacao);
  },

  async updateStatus(request: Request, response: Response) {
    const id = parseId(request.params.id, 'da organização');
    const { status } = await statusOrganizacaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const organizacao = await organizacaoService.updateStatus(id, status);
    response.status(200).json(organizacao);
  },

  async delete(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const id = parseId(request.params.id, 'da organização');
    await organizacaoService.delete(id, userId, role);
    response.status(200).json({ message: 'Organização excluída com sucesso.' });
  },

  async addMember(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const organizacaoId = parseId(request.params.id, 'da organização');
    const { email } = await membroOrganizacaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const membro = await organizacaoService.addMember(
      organizacaoId,
      userId,
      role,
      email,
    );
    response.status(201).json(membro);
  },

  async updateMemberRole(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const organizacaoId = parseId(request.params.id, 'da organização');
    const memberId = parseId(request.params.userId, 'do membro');
    const { papel } = await papelMembroSchema.validate(request.body, {
      stripUnknown: true,
    });
    const membro = await organizacaoService.updateMemberRole(
      organizacaoId,
      userId,
      role,
      memberId,
      papel,
    );
    response.status(200).json(membro);
  },

  async removeMember(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const organizacaoId = parseId(request.params.id, 'da organização');
    const memberId = parseId(request.params.userId, 'do membro');
    await organizacaoService.removeMember(
      organizacaoId,
      userId,
      role,
      memberId,
    );
    response.status(200).json({ message: 'Membro removido com sucesso.' });
  },
};
