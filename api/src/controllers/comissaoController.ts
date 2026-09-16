import type { Request, Response } from 'express';
import prisma from '../config/database.ts';

export const comissaoController = {
  
  async create(req: Request, res: Response) {
    try {
      const { nome, descricao, organizacaoId } = req.body;

      
      if (!nome || !organizacaoId) {
        return res.status(400).json({ error: 'Nome e ID da organização são obrigatórios.' });
      }

      const novaComissao = await prisma.comissao.create({
        data: {
          nome,
          descricao,
          organizacaoId
        }
      });

      return res.status(201).json(novaComissao);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao criar a comissão.' });
    }
  },

  
  async getAllByOrganizacao(req: Request, res: Response) {
    try {
      const { organizacaoId } = req.params;

      const comissoes = await prisma.comissao.findMany({
        where: { organizacaoId: Number(organizacaoId) },
        include: { equipe: true } // Já traz a equipe junto
      });

      return res.status(200).json(comissoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar comissões.' });
    }
  },

  
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.comissao.delete({
        where: { id: Number(id) }
      });

      return res.status(200).json({ message: 'Comissão excluída com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir a comissão.' });
    }
  },

  
  async addMember(req: Request, res: Response) {
    try {
      const { comissaoId } = req.params;
      const { userId, papel } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
      }

      const novoMembro = await prisma.comissaoEquipe.create({
        data: {
          comissaoId: Number(comissaoId),
          userId: Number(userId),
          papel: papel || 'MEMBRO'
        }
      });

      return res.status(201).json(novoMembro);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao adicionar membro ou usuário já cadastrado.' });
    }
  },

 
  async removeMember(req: Request, res: Response) {
    try {
      const { comissaoId, userId } = req.params;

      await prisma.comissaoEquipe.delete({
        where: {
          comissaoId_userId: {
            comissaoId: Number(comissaoId),
            userId: Number(userId)
          }
        }
      });

      return res.status(200).json({ message: 'Membro removido com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao remover o membro.' });
    }
  }
};