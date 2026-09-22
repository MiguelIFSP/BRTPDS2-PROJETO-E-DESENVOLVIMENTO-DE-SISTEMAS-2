import type { PapelOrganizacao } from '@prisma/client';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import type { AuthenticatedRequest } from '../middlewares/auth.ts';
import { OrganizacaoError, organizacaoService } from '../services/organizacaoService.ts';

// controller: valida body, chama o service, devolve json.

const organizationSchema = yup.object({
  nome: yup.string().trim().required('O nome da organização é obrigatório.').max(80, 'O nome da organização deve ter no máximo 80 caracteres.'),
});

const memberSchema = yup.object({
  email: yup.string().trim().email('Informe um e-mail válido.').required('O e-mail do membro é obrigatório.'),
});

// criador nao entra no oneOf de proposito. so e definido na criacao da org.
const memberRoleSchema = yup.object({
  papel: yup
    .string()
    .oneOf(['GERENTE', 'MODERADOR', 'MEMBRO'], 'Papel inválido.')
    .required('Informe o papel do membro.'),
});

// yup = 400, OrganizacaoError = o status que eu coloquei, resto = 500.
const handleError = (response: Response, error: unknown, fallback: string) => {
  if (error instanceof yup.ValidationError) {
    response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
    return;
  }
  if (error instanceof OrganizacaoError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(fallback, error);
  response.status(500).json({ error: fallback });
};

export const organizacaoController = {
  async create(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    try {
      const { nome } = await organizationSchema.validate(request.body, { stripUnknown: true });
      const organizacao = await organizacaoService.create(userId, nome);
      response.status(201).json(organizacao);
    } catch (error) {
      handleError(response, error, 'Não foi possível criar a organização.');
    }
  },

  async getAll(_request: Request, response: Response) {
    try {
      const organizacoes = await organizacaoService.getAll();
      response.status(200).json(organizacoes);
    } catch (error) {
      handleError(response, error, 'Não foi possível listar as organizações.');
    }
  },

  async getMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    try {
      const organizacoes = await organizacaoService.getMine(userId);
      response.status(200).json(organizacoes);
    } catch (error) {
      handleError(response, error, 'Não foi possível listar suas organizações.');
    }
  },

  async getById(request: Request, response: Response) {
    try {
      const id = organizacaoService.parseOrganizationId(request.params.id);
      const organizacao = await organizacaoService.getById(id);
      response.status(200).json(organizacao);
    } catch (error) {
      handleError(response, error, 'Não foi possível buscar a organização.');
    }
  },

  async updateStatus(request: Request, response: Response) {
    try {
      const id = organizacaoService.parseOrganizationId(request.params.id);
      const { status } = await yup
        .object({
          status: yup.string().oneOf(['ACEITA', 'RECUSADA'], 'Status inválido.').required('Informe o status.'),
        })
        .validate(request.body, { stripUnknown: true });
      const organizacao = await organizacaoService.updateStatus(id, status);
      response.status(200).json(organizacao);
    } catch (error) {
      handleError(response, error, 'Não foi possível atualizar a organização.');
    }
  },

  async delete(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    try {
      const id = organizacaoService.parseOrganizationId(request.params.id);
      await organizacaoService.delete(id, userId, role);
      response.status(200).json({ message: 'Organização excluída com sucesso.' });
    } catch (error) {
      handleError(response, error, 'Não foi possível excluir a organização.');
    }
  },

  async addMember(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    try {
      const organizacaoId = organizacaoService.parseOrganizationId(request.params.id);
      const { email } = await memberSchema.validate(request.body, { stripUnknown: true });
      const organizationMember = await organizacaoService.addMember(organizacaoId, userId, role, email);
      response.status(201).json(organizationMember);
    } catch (error) {
      handleError(response, error, 'Não foi possível adicionar o membro.');
    }
  },

  async updateMemberRole(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    try {
      const organizacaoId = organizacaoService.parseOrganizationId(request.params.id);
      const memberId = organizacaoService.parseUserId(request.params.userId);
      const { papel } = await memberRoleSchema.validate(request.body, { stripUnknown: true });
      const member = await organizacaoService.updateMemberRole(
        organizacaoId,
        userId,
        role,
        memberId,
        papel as PapelOrganizacao,
      );
      response.status(200).json(member);
    } catch (error) {
      handleError(response, error, 'Não foi possível atualizar o papel do membro.');
    }
  },

  async removeMember(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    try {
      const organizacaoId = organizacaoService.parseOrganizationId(request.params.id);
      const memberId = organizacaoService.parseUserId(request.params.userId);
      await organizacaoService.removeMember(organizacaoId, userId, role, memberId);
      response.status(200).json({ message: 'Membro removido com sucesso.' });
    } catch (error) {
      handleError(response, error, 'Não foi possível remover o membro.');
    }
  },
};
