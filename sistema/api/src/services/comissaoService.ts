import { PapelComissao, type Prisma, type Role } from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import { countByMonth } from '../utils/monthlyGrowth.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';

type CreateComissaoData = {
  nome: string;
  descricao?: string | undefined;
  organizacaoId: number;
};

type UpdateComissaoData = Omit<CreateComissaoData, 'organizacaoId'>;

// detalhe da comissao: equipe com nome/email (o nome de quem saiu da org
// continua aparecendo) e a org a que ela pertence.
const detalheInclude = {
  organizacao: { select: { id: true, nome: true } },
  equipe: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.ComissaoInclude;

// ordem na equipe: administrador primeiro, membro por ultimo.
const ORDEM_PAPEL = {
  ADMINISTRADOR: 0,
  FACILITADOR: 1,
  SECRETARIO: 2,
  MEMBRO: 3,
} satisfies Record<PapelComissao, number>;

// o que o relatorio precisa de cada comissao: org (nome) e papeis da equipe.
const reportSelect = {
  id: true,
  nome: true,
  descricao: true,
  createdAt: true,
  organizacao: { select: { id: true, nome: true } },
  equipe: { select: { papel: true } },
} satisfies Prisma.ComissaoSelect;

type ComissaoReportRow = Prisma.ComissaoGetPayload<{
  select: typeof reportSelect;
}>;

// mesma ideia do relatorio de organizacoes. comissao nao tem status,
// entao no lugar de "por status" vai "por organizacao".
const buildComissaoReport = (comissoes: ComissaoReportRow[]) => {
  const porOrganizacao = new Map<
    number,
    { organizacaoId: number; nome: string; quantidade: number }
  >();
  for (const comissao of comissoes) {
    const current = porOrganizacao.get(comissao.organizacao.id);
    if (current) {
      current.quantidade += 1;
    } else {
      porOrganizacao.set(comissao.organizacao.id, {
        organizacaoId: comissao.organizacao.id,
        nome: comissao.organizacao.nome,
        quantidade: 1,
      });
    }
  }

  const distribuicaoPapeis = Object.fromEntries(
    Object.values(PapelComissao).map((papel) => [papel, 0]),
  ) as Record<PapelComissao, number>;
  let totalMembros = 0;
  for (const comissao of comissoes) {
    totalMembros += comissao.equipe.length;
    for (const membro of comissao.equipe) {
      distribuicaoPapeis[membro.papel] += 1;
    }
  }

  return {
    total: comissoes.length,
    totalOrganizacoes: porOrganizacao.size,
    porOrganizacao: [...porOrganizacao.values()].sort(
      (a, b) => b.quantidade - a.quantidade,
    ),
    crescimentoPorMes: countByMonth(
      comissoes.map((comissao) => comissao.createdAt),
    ),
    distribuicaoPapeis,
    mediaMembrosPorComissao:
      comissoes.length > 0 ? totalMembros / comissoes.length : 0,
    // lista pro drill-down da tela — nao existe endpoint que liste todas as comissoes.
    comissoes: comissoes
      .map((comissao) => ({
        id: comissao.id,
        nome: comissao.nome,
        descricao: comissao.descricao,
        createdAt: comissao.createdAt,
        organizacao: comissao.organizacao,
        membros: comissao.equipe.length,
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  };
};

// comissao so existe dentro de org aprovada, e so quem e membro da org mexe nela.
const assertMembroDaOrganizacao = async (
  organizacaoId: number,
  userId: number,
) => {
  const organizacao = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    select: {
      status: true,
      membros: { where: { userId }, select: { userId: true } },
    },
  });

  if (!organizacao) {
    throw new AppError(404, 'Organização não encontrada.');
  }
  if (organizacao.membros.length === 0) {
    throw new AppError(403, 'Você não é membro desta organização.');
  }
  if (organizacao.status !== 'ACEITA') {
    throw new AppError(409, 'A organização ainda não foi aprovada.');
  }
};

const getPapelNaComissao = async (comissaoId: number, userId: number) => {
  const comissao = await prisma.comissao.findUnique({
    where: { id: comissaoId },
    select: {
      organizacaoId: true,
      equipe: { where: { userId }, select: { papel: true } },
    },
  });

  if (!comissao) {
    throw new AppError(404, 'Comissão não encontrada.');
  }
  return {
    organizacaoId: comissao.organizacaoId,
    papel: comissao.equipe[0]?.papel,
  };
};

const podeGerenciarEquipe = (papel: PapelComissao | undefined) =>
  papel === 'ADMINISTRADOR' || papel === 'FACILITADOR';

export const comissaoService = {
  /**
   * UC01: Cria uma nova comissão e define o criador como ADMINISTRADOR.
   */
  async create(
    userId: number,
    { nome, descricao, organizacaoId }: CreateComissaoData,
  ) {
    await assertMembroDaOrganizacao(organizacaoId, userId);

    return prisma.comissao.create({
      data: {
        nome,
        descricao: descricao || null,
        organizacaoId,
        equipe: { create: { userId, papel: 'ADMINISTRADOR' } },
      },
    });
  },

  /**
   * UC02: Lista todas as comissões de uma organização (membros da org ou admin do sistema).
   */
  async getAllByOrganizacao(
    organizacaoId: number,
    actorId: number,
    actorRole: Role,
  ) {
    if (actorRole !== 'ADMIN') {
      const membro = await prisma.organizacaoMembro.findUnique({
        where: { organizacaoId_userId: { organizacaoId, userId: actorId } },
      });
      if (!membro) {
        throw new AppError(403, 'Você não é membro desta organização.');
      }
    }

    return prisma.comissao.findMany({
      where: { organizacaoId },
      orderBy: { createdAt: 'desc' },
      include: { equipe: true },
    });
  },

  /**
   * UC02: Detalha uma comissão (membros da org ou admin do sistema).
   */
  async getById(id: number, actorId: number, actorRole: Role) {
    const comissao = await prisma.comissao.findUnique({
      where: { id },
      include: detalheInclude,
    });
    if (!comissao) {
      throw new AppError(404, 'Comissão não encontrada.');
    }

    if (actorRole !== 'ADMIN') {
      const membro = await prisma.organizacaoMembro.findUnique({
        where: {
          organizacaoId_userId: {
            organizacaoId: comissao.organizacaoId,
            userId: actorId,
          },
        },
      });
      if (!membro) {
        throw new AppError(403, 'Você não é membro desta organização.');
      }
    }

    return {
      ...comissao,
      equipe: [...comissao.equipe].sort((left, right) => {
        const byRole = ORDEM_PAPEL[left.papel] - ORDEM_PAPEL[right.papel];
        if (byRole !== 0) return byRole;
        return left.user.name.localeCompare(right.user.name, 'pt-BR');
      }),
    };
  },

  /**
   * UC02: Altera nome e descrição (ADMINISTRADOR ou FACILITADOR).
   */
  async update(
    id: number,
    actorId: number,
    { nome, descricao }: UpdateComissaoData,
  ) {
    const { papel } = await getPapelNaComissao(id, actorId);

    if (!podeGerenciarEquipe(papel)) {
      throw new AppError(
        403,
        'Acesso negado. Apenas administrador ou facilitador pode editar a comissão.',
      );
    }

    return prisma.comissao.update({
      where: { id },
      data: { nome, descricao: descricao || null },
    });
  },

  /**
   * UC02: Exclui uma comissão (Apenas ADMINISTRADOR).
   */
  async delete(id: number, actorId: number) {
    const { papel } = await getPapelNaComissao(id, actorId);

    if (papel !== 'ADMINISTRADOR') {
      throw new AppError(
        403,
        'Acesso negado. Apenas o administrador pode excluir a comissão.',
      );
    }

    // equipe sai junto pelo onDelete: Cascade do schema.
    await prisma.comissao.delete({ where: { id } });
  },

  /**
   * UC03: Adiciona um membro à equipe (ADMINISTRADOR ou FACILITADOR).
   */
  async addMember(
    comissaoId: number,
    actorId: number,
    userId: number,
    papel: PapelComissao,
  ) {
    const { organizacaoId, papel: papelRequester } = await getPapelNaComissao(
      comissaoId,
      actorId,
    );

    if (!podeGerenciarEquipe(papelRequester)) {
      throw new AppError(
        403,
        'Acesso negado. Você não tem permissão para gerenciar a equipe.',
      );
    }
    // facilitador nao pode criar administrador (senao se promove por tabela).
    if (papel === 'ADMINISTRADOR' && papelRequester !== 'ADMINISTRADOR') {
      throw new AppError(
        403,
        'Apenas o administrador pode adicionar outro administrador.',
      );
    }

    const membroDaOrg = await prisma.organizacaoMembro.findUnique({
      where: { organizacaoId_userId: { organizacaoId, userId } },
    });
    if (!membroDaOrg) {
      throw new AppError(
        400,
        'O usuário precisa ser membro da organização para entrar na comissão.',
      );
    }

    try {
      return await prisma.comissaoEquipe.create({
        data: { comissaoId, userId, papel },
      });
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
        throw new AppError(409, 'Este usuário já faz parte da comissão.');
      }
      throw error;
    }
  },

  /**
   * UC03: Remove um membro da comissão (ADMINISTRADOR ou FACILITADOR).
   */
  async removeMember(comissaoId: number, actorId: number, userId: number) {
    const { papel: papelRequester } = await getPapelNaComissao(
      comissaoId,
      actorId,
    );

    if (!podeGerenciarEquipe(papelRequester)) {
      throw new AppError(
        403,
        'Acesso negado. Você não tem permissão para remover membros.',
      );
    }

    const alvo = await prisma.comissaoEquipe.findUnique({
      where: { comissaoId_userId: { comissaoId, userId } },
    });
    if (!alvo) {
      throw new AppError(404, 'Membro não encontrado na comissão.');
    }

    // Regra extra: Um administrador não pode ser removido por um facilitador
    if (alvo.papel === 'ADMINISTRADOR' && papelRequester !== 'ADMINISTRADOR') {
      throw new AppError(
        403,
        'Um facilitador não pode remover um administrador.',
      );
    }

    // sem administrador ninguem mais consegue excluir a comissao.
    if (alvo.papel === 'ADMINISTRADOR') {
      const administradores = await prisma.comissaoEquipe.count({
        where: { comissaoId, papel: 'ADMINISTRADOR' },
      });
      if (administradores <= 1) {
        throw new AppError(
          400,
          'A comissão precisa de pelo menos um administrador.',
        );
      }
    }

    await prisma.comissaoEquipe.delete({
      where: { comissaoId_userId: { comissaoId, userId } },
    });
  },

  // relatorio do admin: todas as comissoes.
  async getReport() {
    const comissoes = await prisma.comissao.findMany({ select: reportSelect });
    return buildComissaoReport(comissoes);
  },

  // relatorio do usuario: so as comissoes em que ele esta na equipe.
  async getReportMine(userId: number) {
    const comissoes = await prisma.comissao.findMany({
      where: { equipe: { some: { userId } } },
      select: reportSelect,
    });
    return buildComissaoReport(comissoes);
  },
};
