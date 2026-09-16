import type { Request, Response } from 'express';
import * as yup from 'yup';
import prisma from '../config/database.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.ts';

const organizationSchema = yup.object({
  nome: yup.string().trim().required('O nome da organização é obrigatório.').max(80, 'O nome da organização deve ter no máximo 80 caracteres.'),
});

const memberSchema = yup.object({
  email: yup.string().trim().email('Informe um e-mail válido.').required('O e-mail do membro é obrigatório.'),
  papel: yup.string().trim().default('MEMBRO'),
});

const parseOrganizationId = (request: Request, response: Response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    response.status(400).json({ error: 'Identificador da organização inválido.' });
    return null;
  }
  return id;
};

const organizationDetails = {
  solicitante: { select: { id: true, name: true, email: true } },
  membros: { include: { user: { select: { id: true, name: true, email: true } } } },
  comissoes: true,
};

export const organizacaoController = {
  async create(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    try {
      const { nome } = await organizationSchema.validate(request.body, { stripUnknown: true });
      const organizacao = await prisma.organizacao.create({
        data: { nome, status: 'PENDENTE', solicitanteId: userId },
      });
      response.status(201).json(organizacao);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro ao criar organização:', error);
      response.status(500).json({ error: 'Não foi possível criar a organização.' });
    }
  },

  async getAll(_request: Request, response: Response) {
    try {
      const organizacoes = await prisma.organizacao.findMany({ orderBy: { id: 'desc' }, include: organizationDetails });
      response.status(200).json(organizacoes);
    } catch (error) {
      console.error('Erro ao listar organizações:', error);
      response.status(500).json({ error: 'Não foi possível listar as organizações.' });
    }
  },

  async getMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    try {
      const organizacoes = await prisma.organizacao.findMany({
        where: { OR: [{ solicitanteId: userId }, { membros: { some: { userId } } }] },
        orderBy: { id: 'desc' },
        include: organizationDetails,
      });
      response.status(200).json(organizacoes);
    } catch (error) {
      console.error('Erro ao listar organizações do usuário:', error);
      response.status(500).json({ error: 'Não foi possível listar suas organizações.' });
    }
  },

  async getById(request: Request, response: Response) {
    const id = parseOrganizationId(request, response);
    if (id === null) return;
    try {
      const organizacao = await prisma.organizacao.findUnique({ where: { id }, include: organizationDetails });
      if (!organizacao) {
        response.status(404).json({ error: 'Organização não encontrada.' });
        return;
      }
      response.status(200).json(organizacao);
    } catch (error) {
      console.error('Erro ao buscar organização:', error);
      response.status(500).json({ error: 'Não foi possível buscar a organização.' });
    }
  },

  async updateStatus(request: Request, response: Response) {
    const id = parseOrganizationId(request, response);
    if (id === null) return;
    try {
      const { status } = await yup.object({
        status: yup.string().oneOf(['ACEITA', 'RECUSADA'], 'Status inválido.').required('Informe o status.'),
      }).validate(request.body, { stripUnknown: true });
      const organizacao = await prisma.$transaction(async (transaction) => {
        const updated = await transaction.organizacao.update({ where: { id }, data: { status }, include: organizationDetails });
        if (status === 'ACEITA' && updated.solicitanteId !== null) {
          await transaction.organizacaoMembro.upsert({
            where: { organizacaoId_userId: { organizacaoId: id, userId: updated.solicitanteId } },
            update: { papel: 'RESPONSAVEL' },
            create: { organizacaoId: id, userId: updated.solicitanteId, papel: 'RESPONSAVEL' },
          });
        }
        return updated;
      });
      response.status(200).json(organizacao);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        response.status(404).json({ error: 'Organização não encontrada.' });
        return;
      }
      console.error('Erro ao atualizar status da organização:', error);
      response.status(500).json({ error: 'Não foi possível atualizar a organização.' });
    }
  },

  async addMember(request: Request, response: Response) {
    const organizacaoId = parseOrganizationId(request, response);
    if (organizacaoId === null) return;
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    try {
      const organizacao = await prisma.organizacao.findUnique({ where: { id: organizacaoId } });
      if (!organizacao || organizacao.status !== 'ACEITA') {
        response.status(404).json({ error: 'Organização aprovada não encontrada.' });
        return;
      }
      if (role !== 'ADMIN' && organizacao.solicitanteId !== userId) {
        response.status(403).json({ error: 'Somente o responsável pode adicionar membros.' });
        return;
      }
      const { email, papel } = await memberSchema.validate(request.body, { stripUnknown: true });
      const member = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!member) {
        response.status(404).json({ error: 'Usuário não encontrado. A pessoa precisa criar uma conta primeiro.' });
        return;
      }
      const organizationMember = await prisma.organizacaoMembro.create({
        data: { organizacaoId, userId: member.id, papel },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      response.status(201).json(organizationMember);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        response.status(409).json({ error: 'Este usuário já é membro da organização.' });
        return;
      }
      console.error('Erro ao adicionar membro:', error);
      response.status(500).json({ error: 'Não foi possível adicionar o membro.' });
    }
  },

  async removeMember(request: Request, response: Response) {
    const organizacaoId = parseOrganizationId(request, response);
    if (organizacaoId === null) return;
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const memberId = Number(request.params.userId);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      response.status(400).json({ error: 'Identificador do membro inválido.' });
      return;
    }
    try {
      const organizacao = await prisma.organizacao.findUnique({ where: { id: organizacaoId } });
      if (!organizacao || (role !== 'ADMIN' && organizacao.solicitanteId !== userId)) {
        response.status(403).json({ error: 'Somente o responsável pode remover membros.' });
        return;
      }
      if (memberId === organizacao.solicitanteId) {
        response.status(400).json({ error: 'O responsável não pode ser removido da organização.' });
        return;
      }
      await prisma.organizacaoMembro.delete({ where: { organizacaoId_userId: { organizacaoId, userId: memberId } } });
      response.status(200).json({ message: 'Membro removido com sucesso.' });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        response.status(404).json({ error: 'Membro não encontrado.' });
        return;
      }
      console.error('Erro ao remover membro:', error);
      response.status(500).json({ error: 'Não foi possível remover o membro.' });
    }
  },
};