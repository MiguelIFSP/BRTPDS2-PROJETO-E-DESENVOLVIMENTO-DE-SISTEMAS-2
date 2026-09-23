import type { PapelOrganizacao, Prisma } from '@prisma/client';
import prisma from '../config/database.ts';

// erro com status http. o controller devolve isso para o app.
export class OrganizacaoError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'OrganizacaoError';
    this.statusCode = statusCode;
  }
}

export const PAPEIS_ORGANIZACAO = ['CRIADOR', 'GERENTE', 'MODERADOR', 'MEMBRO'] as const;
export type PapelMembro = (typeof PAPEIS_ORGANIZACAO)[number];

// teto por cargo. membro e criador nao entram aqui.
const LIMITE_POR_PAPEL: Partial<Record<PapelOrganizacao, number>> = {
  GERENTE: 1,
  MODERADOR: 2,
};

// ordem na listagem: criador primeiro, membro por ultimo.
const ORDEM_PAPEL: Record<PapelOrganizacao, number> = {
  CRIADOR: 0,
  GERENTE: 1,
  MODERADOR: 2,
  MEMBRO: 3,
};

// include padrao ao buscar org: membros (com user) e comissoes.
const organizationDetails = {
  membros: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  comissoes: true,
} satisfies Prisma.OrganizacaoInclude;

// id da url tem que ser numero positivo. se for invalido, 400.
const parseId = (rawId: string | string[] | undefined, message: string) => {
  const value = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new OrganizacaoError(400, message);
  }
  return id;
};

const parseOrganizationId = (rawId: string | string[] | undefined) =>
  parseId(rawId, 'Identificador da organização inválido.');

const parseUserId = (rawId: string | string[] | undefined) =>
  parseId(rawId, 'Identificador do membro inválido.');

const sortMembers = <T extends { papel: PapelOrganizacao; user: { name: string } }>(members: T[]) =>
  [...members].sort((left, right) => {
    const byRole = ORDEM_PAPEL[left.papel] - ORDEM_PAPEL[right.papel];
    if (byRole !== 0) return byRole;
    return left.user.name.localeCompare(right.user.name, 'pt-BR');
  });

const withSortedMembers = <T extends { membros: Array<{ papel: PapelOrganizacao; user: { name: string } }> }>(organization: T) => ({
  ...organization,
  membros: sortMembers(organization.membros),
});

// admin do sistema passa. usuario comum so se o papel dele estiver na lista.
const assertCanManage = (
  actorRole: 'USER' | 'ADMIN',
  actorPapel: PapelOrganizacao | undefined,
  allowed: PapelOrganizacao[],
  message: string,
) => {
  if (actorRole === 'ADMIN') return;
  if (!actorPapel || !allowed.includes(actorPapel)) {
    throw new OrganizacaoError(403, message);
  }
};

// conta quantos ja tem aquele cargo. excludedUserId = quem ta mudando de papel, pra nao contar ele duas vezes.
const assertRoleCapacity = async (
  transaction: Prisma.TransactionClient,
  organizacaoId: number,
  papel: PapelOrganizacao,
  excludedUserId?: number,
) => {
  const limit = LIMITE_POR_PAPEL[papel];
  if (!limit) return;

  const count = await transaction.organizacaoMembro.count({
    where: {
      organizacaoId,
      papel,
      ...(excludedUserId ? { userId: { not: excludedUserId } } : {}),
    },
  });

  if (count >= limit) {
    const label = papel === 'GERENTE' ? 'gerente' : 'moderador';
    throw new OrganizacaoError(409, `Esta organização já possui o máximo de ${limit} ${label}(es).`);
  }
};

export const organizacaoService = {
  parseOrganizationId,
  parseUserId,

  // cria pendente e coloca o solicitante como criador. admin ainda precisa aceitar.
  async create(userId: number, nome: string) {
    const organizacao = await prisma.organizacao.create({
      data: {
        nome,
        status: 'PENDENTE',
        membros: {
          create: { userId, papel: 'CRIADOR' },
        },
      },
      include: organizationDetails,
    });
    return withSortedMembers(organizacao);
  },

  // tela do admin: todas as orgs.
  async getAll() {
    const organizacoes = await prisma.organizacao.findMany({
      orderBy: { id: 'desc' },
      include: organizationDetails,
    });
    return organizacoes.map(withSortedMembers);
  },

  // so as orgs em que o usuario e membro.
  async getMine(userId: number) {
    const organizacoes = await prisma.organizacao.findMany({
      where: { membros: { some: { userId } } },
      orderBy: { id: 'desc' },
      include: organizationDetails,
    });
    return organizacoes.map(withSortedMembers);
  },

  async getById(id: number) {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id },
      include: organizationDetails,
    });
    if (!organizacao) {
      throw new OrganizacaoError(404, 'Organização não encontrada.');
    }
    return withSortedMembers(organizacao);
  },

  // admin aceita ou recusa. criador ja existe, so muda o status.
  async updateStatus(id: number, status: 'ACEITA' | 'RECUSADA') {
    try {
      const organizacao = await prisma.organizacao.update({
        where: { id },
        data: { status },
        include: organizationDetails,
      });
      return withSortedMembers(organizacao);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        throw new OrganizacaoError(404, 'Organização não encontrada.');
      }
      throw error;
    }
  },

  // so criador (ou admin da plataforma) apaga. remove comissao e membro junto.
  async delete(id: number, userId: number, role: 'USER' | 'ADMIN') {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id },
      include: { membros: true },
    });
    if (!organizacao) {
      throw new OrganizacaoError(404, 'Organização não encontrada.');
    }

    const actor = organizacao.membros.find((member) => member.userId === userId);
    if (role !== 'ADMIN' && actor?.papel !== 'CRIADOR') {
      throw new OrganizacaoError(403, 'Somente o criador pode excluir a organização.');
    }

    await prisma.$transaction(async (transaction) => {
      const comissoes = await transaction.comissao.findMany({
        where: { organizacaoId: id },
        select: { id: true },
      });
      const comissaoIds = comissoes.map((comissao) => comissao.id);

      await transaction.organizacaoMembro.deleteMany({ where: { organizacaoId: id } });
      if (comissaoIds.length > 0) {
        await transaction.comissaoEquipe.deleteMany({ where: { comissaoId: { in: comissaoIds } } });
        await transaction.comissao.deleteMany({ where: { id: { in: comissaoIds } } });
      }
      await transaction.organizacao.delete({ where: { id } });
    });
  },

  // org tem que estar aceita. criador/gerente/moderador convida. entra sempre como membro.
  async addMember(organizacaoId: number, actorId: number, actorRole: 'USER' | 'ADMIN', email: string) {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id: organizacaoId },
      include: { membros: true },
    });
    if (!organizacao || organizacao.status !== 'ACEITA') {
      throw new OrganizacaoError(404, 'Organização aprovada não encontrada.');
    }

    const actor = organizacao.membros.find((member) => member.userId === actorId);
    assertCanManage(
      actorRole,
      actor?.papel,
      ['CRIADOR', 'GERENTE', 'MODERADOR'],
      'Somente criador, gerente ou moderador pode adicionar membros.',
    );

    const member = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!member) {
      throw new OrganizacaoError(404, 'Usuário não encontrado. A pessoa precisa criar uma conta primeiro.');
    }

    try {
      return await prisma.organizacaoMembro.create({
        data: { organizacaoId, userId: member.id, papel: 'MEMBRO' },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
    } catch (error) {
      // p2002 = unique (ja e membro)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        throw new OrganizacaoError(409, 'Este usuário já é membro da organização.');
      }
      throw error;
    }
  },

  // promover/rebaixar. so criador (ou admin da plataforma, se tambem for membro).
  // atribuir CRIADOR so e permitido quando quem esta atribuindo ja e o criador atual —
  // isso e uma transferencia de organizacao (ex.: criador excluindo a propria conta).
  // o criador anterior vira MEMBRO na mesma operação, pra nunca sobrar mais de um criador.
  async updateMemberRole(
    organizacaoId: number,
    actorId: number,
    actorRole: 'USER' | 'ADMIN',
    memberId: number,
    papel: PapelOrganizacao,
  ) {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id: organizacaoId },
      include: { membros: true },
    });
    if (!organizacao) {
      throw new OrganizacaoError(404, 'Organização não encontrada.');
    }

    const actor = organizacao.membros.find((member) => member.userId === actorId);
    assertCanManage(actorRole, actor?.papel, ['CRIADOR'], 'Somente o criador pode promover ou rebaixar membros.');

    if (papel === 'CRIADOR' && actor?.papel !== 'CRIADOR') {
      throw new OrganizacaoError(400, 'Não é possível atribuir o papel de criador.');
    }

    const target = organizacao.membros.find((member) => member.userId === memberId);
    if (!target) {
      throw new OrganizacaoError(404, 'Membro não encontrado.');
    }
    if (target.papel === 'CRIADOR') {
      throw new OrganizacaoError(400, 'O criador não pode ter o papel alterado.');
    }
    if (memberId === actorId && actorRole !== 'ADMIN') {
      throw new OrganizacaoError(400, 'Você não pode alterar o próprio papel.');
    }

    const updated = await prisma.$transaction(async (transaction) => {
      await assertRoleCapacity(transaction, organizacaoId, papel, memberId);
      const updatedMember = await transaction.organizacaoMembro.update({
        where: { organizacaoId_userId: { organizacaoId, userId: memberId } },
        data: { papel },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (papel === 'CRIADOR') {
        await transaction.organizacaoMembro.update({
          where: { organizacaoId_userId: { organizacaoId, userId: actorId } },
          data: { papel: 'MEMBRO' },
        });
      }

      return updatedMember;
    });

    return updated;
  },

  // criador e gerente removem usuario. o criador nao pode ser removido.
  async removeMember(organizacaoId: number, actorId: number, actorRole: 'USER' | 'ADMIN', memberId: number) {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id: organizacaoId },
      include: { membros: true },
    });
    if (!organizacao) {
      throw new OrganizacaoError(404, 'Organização não encontrada.');
    }

    const actor = organizacao.membros.find((member) => member.userId === actorId);
    assertCanManage(actorRole, actor?.papel, ['CRIADOR', 'GERENTE'], 'Somente o criador ou o gerente pode remover membros.');

    const target = organizacao.membros.find((member) => member.userId === memberId);
    if (!target) {
      throw new OrganizacaoError(404, 'Membro não encontrado.');
    }
    if (target.papel === 'CRIADOR') {
      throw new OrganizacaoError(400, 'O criador não pode ser removido da organização.');
    }

    await prisma.organizacaoMembro.delete({
      where: { organizacaoId_userId: { organizacaoId, userId: memberId } },
    });
  },
};
