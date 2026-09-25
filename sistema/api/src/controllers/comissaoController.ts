import type { PapelComissao } from '@prisma/client';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import prisma from '../config/database.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.ts';
import { PAPEIS_COMISSAO, comissaoService } from '../services/comissaoService.ts';

// quem faz a requisicao vem sempre do token (requireAuth), nunca de header/body —
// antes era um header "user-id" que qualquer um podia forjar.

// erro com status http. o controller devolve isso para o app.
class ComissaoError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ComissaoError';
    this.statusCode = statusCode;
  }
}

const comissaoSchema = yup.object({
  nome: yup.string().trim().required('O nome da comissão é obrigatório.').max(80, 'O nome da comissão deve ter no máximo 80 caracteres.'),
  descricao: yup.string().trim().max(500, 'A descrição deve ter no máximo 500 caracteres.').optional(),
  organizacaoId: yup.number().integer().positive('Organização inválida.').required('Informe a organização.'),
});

const memberSchema = yup.object({
  userId: yup.number().integer().positive('Usuário inválido.').required('Informe o usuário.'),
  papel: yup.string().oneOf([...PAPEIS_COMISSAO], 'Papel inválido.').default('MEMBRO'),
});

// yup = 400, ComissaoError = o status que eu coloquei, resto = 500.
const handleError = (response: Response, error: unknown, fallback: string) => {
  if (error instanceof yup.ValidationError) {
    response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
    return;
  }
  if (error instanceof ComissaoError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }
  console.error(fallback, error);
  response.status(500).json({ error: fallback });
};

const parseId = (rawId: string | string[] | undefined, message: string) => {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ComissaoError(400, message);
  }
  return id;
};

// comissao so existe dentro de org aprovada, e so quem e membro da org mexe nela.
const assertMembroDaOrganizacao = async (organizacaoId: number, userId: number) => {
  const organizacao = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    select: { status: true, membros: { where: { userId }, select: { userId: true } } },
  });

  if (!organizacao) {
    throw new ComissaoError(404, 'Organização não encontrada.');
  }
  if (organizacao.membros.length === 0) {
    throw new ComissaoError(403, 'Você não é membro desta organização.');
  }
  if (organizacao.status !== 'ACEITA') {
    throw new ComissaoError(409, 'A organização ainda não foi aprovada.');
  }
};

const getPapelNaComissao = async (comissaoId: number, userId: number) => {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: { organizacaoId: true, equipe: { where: { userId }, select: { papel: true } } },
  });

  if (!comissao) {
    throw new ComissaoError(404, 'Comissão não encontrada.');
  }
  return { organizacaoId: comissao.organizacaoId, papel: comissao.equipe[0]?.papel as PapelComissao | undefined };
};

const podeGerenciarEquipe = (papel?: PapelComissao) => papel === 'ADMINISTRADOR' || papel === 'FACILITADOR';

export const comissaoController = {
  /**
   * UC01: Cria uma nova comissão e define o criador como ADMINISTRADOR.
   */
  async create(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    try {
      const { nome, descricao, organizacaoId } = await comissaoSchema.validate(req.body, { stripUnknown: true });
      await assertMembroDaOrganizacao(organizacaoId, userId);

      const novaComissao = await prisma.comissao.create({
        data: {
          nome,
          descricao: descricao || null,
          organizacaoId,
          equipe: { create: { userId, papel: 'ADMINISTRADOR' } },
        },
      });

      return res.status(201).json(novaComissao);
    } catch (error) {
      handleError(res, error, 'Erro interno ao criar a comissão.');
    }
  },

  /**
   * UC02: Lista todas as comissões de uma organização (membros da org ou admin do sistema).
   */
  async getAllByOrganizacao(req: Request, res: Response) {
    const { id: userId, role } = (req as AuthenticatedRequest).user;
    try {
      const organizacaoId = parseId(req.params.organizacaoId, 'Identificador da organização inválido.');

      if (role !== 'ADMIN') {
        const membro = await prisma.organizacaoMembro.findUnique({
          where: { organizacaoId_userId: { organizacaoId, userId } },
        });
        if (!membro) {
          throw new ComissaoError(403, 'Você não é membro desta organização.');
        }
      }

      const comissoes = await prisma.comissao.findMany({
        where: { organizacaoId },
        orderBy: { createdAt: 'desc' },
        include: { equipe: true },
      });

      return res.status(200).json(comissoes);
    } catch (error) {
      handleError(res, error, 'Erro ao buscar comissões.');
    }
  },

  /**
   * UC02: Exclui uma comissão (Apenas ADMINISTRADOR).
   */
  async delete(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    try {
      const id = parseId(req.params.id, 'Identificador da comissão inválido.');
      const { papel } = await getPapelNaComissao(id, userId);

      if (papel !== 'ADMINISTRADOR') {
        throw new ComissaoError(403, 'Acesso negado. Apenas o administrador pode excluir a comissão.');
      }

      // equipe sai junto pelo onDelete: Cascade do schema.
      await prisma.comissao.delete({ where: { id } });

      return res.status(200).json({ message: 'Comissão excluída com sucesso.' });
    } catch (error) {
      handleError(res, error, 'Erro ao excluir a comissão.');
    }
  },

  /**
   * UC03: Adiciona um membro à equipe (ADMINISTRADOR ou FACILITADOR).
   */
  async addMember(req: Request, res: Response) {
    const { id: requesterId } = (req as AuthenticatedRequest).user;
    try {
      const comissaoId = parseId(req.params.comissaoId, 'Identificador da comissão inválido.');
      const { userId, papel } = await memberSchema.validate(req.body, { stripUnknown: true });
      const { organizacaoId, papel: papelRequester } = await getPapelNaComissao(comissaoId, requesterId);

      if (!podeGerenciarEquipe(papelRequester)) {
        throw new ComissaoError(403, 'Acesso negado. Você não tem permissão para gerenciar a equipe.');
      }
      // facilitador nao pode criar administrador (senao se promove por tabela).
      if (papel === 'ADMINISTRADOR' && papelRequester !== 'ADMINISTRADOR') {
        throw new ComissaoError(403, 'Apenas o administrador pode adicionar outro administrador.');
      }

      const membroDaOrg = await prisma.organizacaoMembro.findUnique({
        where: { organizacaoId_userId: { organizacaoId, userId } },
      });
      if (!membroDaOrg) {
        throw new ComissaoError(400, 'O usuário precisa ser membro da organização para entrar na comissão.');
      }

      const jaMembro = await prisma.comissaoEquipe.findUnique({
        where: { comissaoId_userId: { comissaoId, userId } },
      });
      if (jaMembro) {
        throw new ComissaoError(409, 'Este usuário já faz parte da comissão.');
      }

      const novoMembro = await prisma.comissaoEquipe.create({
        data: { comissaoId, userId, papel: papel as PapelComissao },
      });

      return res.status(201).json(novoMembro);
    } catch (error) {
      handleError(res, error, 'Erro ao adicionar membro.');
    }
  },

  /**
   * UC03: Remove um membro da comissão (ADMINISTRADOR ou FACILITADOR).
   */
  async removeMember(req: Request, res: Response) {
    const { id: requesterId } = (req as AuthenticatedRequest).user;
    try {
      const comissaoId = parseId(req.params.comissaoId, 'Identificador da comissão inválido.');
      const userId = parseId(req.params.userId, 'Identificador do membro inválido.');
      const { papel: papelRequester } = await getPapelNaComissao(comissaoId, requesterId);

      if (!podeGerenciarEquipe(papelRequester)) {
        throw new ComissaoError(403, 'Acesso negado. Você não tem permissão para remover membros.');
      }

      const alvo = await prisma.comissaoEquipe.findUnique({
        where: { comissaoId_userId: { comissaoId, userId } },
      });
      if (!alvo) {
        throw new ComissaoError(404, 'Membro não encontrado na comissão.');
      }

      // Regra extra: Um administrador não pode ser removido por um facilitador
      if (alvo.papel === 'ADMINISTRADOR' && papelRequester !== 'ADMINISTRADOR') {
        throw new ComissaoError(403, 'Um facilitador não pode remover um administrador.');
      }

      // sem administrador ninguem mais consegue excluir a comissao.
      if (alvo.papel === 'ADMINISTRADOR') {
        const administradores = await prisma.comissaoEquipe.count({
          where: { comissaoId, papel: 'ADMINISTRADOR' },
        });
        if (administradores <= 1) {
          throw new ComissaoError(400, 'A comissão precisa de pelo menos um administrador.');
        }
      }

      await prisma.comissaoEquipe.delete({
        where: { comissaoId_userId: { comissaoId, userId } },
      });

      return res.status(200).json({ message: 'Membro removido com sucesso.' });
    } catch (error) {
      handleError(res, error, 'Erro ao remover o membro.');
    }
  },

  /**
   * Relatório de comissões (admin): agregados sobre todas as comissões.
   */
  async getReport(_req: Request, res: Response) {
    try {
      const report = await comissaoService.getReport();
      return res.status(200).json(report);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Não foi possível gerar o relatório de comissões.' });
    }
  },

  /**
   * Relatório das comissões do usuário logado (só as que ele participa).
   */
  async getReportMine(req: Request, res: Response) {
    const { id: userId } = (req as AuthenticatedRequest).user;
    try {
      const report = await comissaoService.getReportMine(userId);
      return res.status(200).json(report);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Não foi possível gerar o relatório das suas comissões.' });
    }
  }
};
