import type { Request, Response } from 'express';
import prisma from '/Users/Alpha/Documents/GitHub/BRTPDS2-PROJETO-E-DESENVOLVIMENTO-DE-SISTEMAS-2/sistema/api/prisma.config.ts'; 

export const comissaoController = {
  /**
   * UC01: Cria uma nova comissão e define o criador como ADMINISTRADOR.
   */
  async create(req: Request, res: Response) {
    try {
      const { nome, descricao, organizacaoId } = req.body;
      const requesterId = Number(req.headers['user-id']); // ID de quem está criando

      if (!nome || !organizacaoId || !requesterId) {
        return res.status(400).json({ error: 'Nome, ID da organização e cabeçalho user-id são obrigatórios.' });
      }

      const novaComissao = await prisma.comissao.create({
        data: {
          nome,
          descricao,
          organizacaoId: Number(organizacaoId),
          equipe: {
            create: {
              userId: requesterId,
              papel: 'ADMINISTRADOR' // Usando o Enum atualizado
            }
          }
        }
      });

      return res.status(201).json(novaComissao);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno ao criar a comissão.' });
    }
  },

  /**
   * UC02: Lista todas as comissões de uma organização.
   */
  async getAllByOrganizacao(req: Request, res: Response) {
    try {
      const { organizacaoId } = req.params;

      const comissoes = await prisma.comissao.findMany({
        where: { organizacaoId: Number(organizacaoId) },
        include: { equipe: true }
      });

      return res.status(200).json(comissoes);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar comissões.' });
    }
  },

  /**
   * UC02: Exclui uma comissão (Apenas ADMINISTRADOR).
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const requesterId = Number(req.headers['user-id']);

      if (!requesterId) return res.status(401).json({ error: 'Usuário não identificado (user-id ausente).' });

      // Verifica o papel do usuário na comissão
      const permissao = await prisma.comissaoEquipe.findUnique({
        where: {
          comissaoId_userId: {
            comissaoId: Number(id),
            userId: requesterId
          }
        }
      });

      if (!permissao || permissao.papel !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Acesso negado. Apenas o administrador pode excluir a comissão.' });
      }

      await prisma.comissao.delete({
        where: { id: Number(id) }
      });

      return res.status(200).json({ message: 'Comissão excluída com sucesso.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir a comissão.' });
    }
  },

  /**
   * UC03: Adiciona um membro à equipe (ADMINISTRADOR ou FACILITADOR).
   */
  async addMember(req: Request, res: Response) {
    try {
      const { comissaoId } = req.params;
      const { userId, papel } = req.body;
      const requesterId = Number(req.headers['user-id']);

      if (!userId || !requesterId) {
        return res.status(400).json({ error: 'ID do usuário e cabeçalho user-id são obrigatórios.' });
      }

      // Verifica permissão de quem está tentando adicionar
      const permissao = await prisma.comissaoEquipe.findUnique({
        where: {
          comissaoId_userId: { comissaoId: Number(comissaoId), userId: requesterId }
        }
      });

      if (!permissao || (permissao.papel !== 'ADMINISTRADOR' && permissao.papel !== 'FACILITADOR')) {
        return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para gerenciar a equipe.' });
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
      return res.status(500).json({ error: 'Erro ao adicionar membro (ou usuário já cadastrado).' });
    }
  },

  /**
   * UC03: Remove um membro da comissão (ADMINISTRADOR ou FACILITADOR).
   */
  async removeMember(req: Request, res: Response) {
    try {
      const { comissaoId, userId } = req.params;
      const requesterId = Number(req.headers['user-id']);

      if (!requesterId) return res.status(401).json({ error: 'Usuário não identificado.' });

      // Verifica permissão
      const permissao = await prisma.comissaoEquipe.findUnique({
        where: {
          comissaoId_userId: { comissaoId: Number(comissaoId), userId: requesterId }
        }
      });

      if (!permissao || (permissao.papel !== 'ADMINISTRADOR' && permissao.papel !== 'FACILITADOR')) {
        return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para remover membros.' });
      }

      // Regra extra: Um administrador não pode ser removido por um facilitador
      const alvo = await prisma.comissaoEquipe.findUnique({
        where: { comissaoId_userId: { comissaoId: Number(comissaoId), userId: Number(userId) } }
      });
      if (alvo?.papel === 'ADMINISTRADOR' && permissao.papel !== 'ADMINISTRADOR') {
        return res.status(403).json({ error: 'Um facilitador não pode remover um administrador.' });
      }

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