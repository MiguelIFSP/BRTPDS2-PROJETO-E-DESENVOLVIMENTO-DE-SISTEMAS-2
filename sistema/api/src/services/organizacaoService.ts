import {
  PapelOrganizacao,
  StatusOrganizacao,
  type Prisma,
  type Role,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import { countByMonth } from '../utils/monthlyGrowth.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';

// teto por cargo. membro e criador nao entram aqui.
const LIMITE_POR_PAPEL = {
  GERENTE: 1,
  MODERADOR: 2,
} satisfies Partial<Record<PapelOrganizacao, number>>;

const ROTULO_LIMITE = {
  GERENTE: 'gerente',
  MODERADOR: 'moderador',
} satisfies Record<keyof typeof LIMITE_POR_PAPEL, string>;

// ordem na listagem: criador primeiro, membro por ultimo.
const ORDEM_PAPEL = {
  CRIADOR: 0,
  GERENTE: 1,
  MODERADOR: 2,
  MEMBRO: 3,
} satisfies Record<PapelOrganizacao, number>;

const membroUserSelect = {
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.OrganizacaoMembroInclude;

// include padrao ao buscar org: membros (com user) e comissoes.
const organizacaoDetails = {
  membros: { include: membroUserSelect },
  comissoes: true,
} satisfies Prisma.OrganizacaoInclude;

const reportSelect = {
  status: true,
  createdAt: true,
  membros: { select: { papel: true } },
} satisfies Prisma.OrganizacaoSelect;

type OrganizacaoReportRow = Prisma.OrganizacaoGetPayload<{
  select: typeof reportSelect;
}>;

const zeroPor = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;

// relatorio calculado em cima de uma lista de organizacoes (com membros incluidos) —
// usado tanto pra "todas" (admin) quanto pra "so as minhas" (membro), mesma forma.
const buildOrganizacaoReport = (organizacoes: OrganizacaoReportRow[]) => {
  const porStatus = zeroPor(Object.values(StatusOrganizacao));
  for (const organizacao of organizacoes) {
    porStatus[organizacao.status] += 1;
  }

  const aceitas = organizacoes.filter(
    (organizacao) => organizacao.status === 'ACEITA',
  );
  const distribuicaoPapeis = zeroPor(Object.values(PapelOrganizacao));
  let totalMembrosAceitas = 0;
  for (const organizacao of aceitas) {
    totalMembrosAceitas += organizacao.membros.length;
    for (const membro of organizacao.membros) {
      distribuicaoPapeis[membro.papel] += 1;
    }
  }

  return {
    total: organizacoes.length,
    porStatus,
    crescimentoPorMes: countByMonth(
      organizacoes.map((organizacao) => organizacao.createdAt),
    ),
    distribuicaoPapeis,
    mediaMembrosPorOrganizacao:
      aceitas.length > 0 ? totalMembrosAceitas / aceitas.length : 0,
  };
};

const sortMembros = <
  T extends { papel: PapelOrganizacao; user: { name: string } },
>(
  membros: T[],
) =>
  [...membros].sort((left, right) => {
    const byRole = ORDEM_PAPEL[left.papel] - ORDEM_PAPEL[right.papel];
    if (byRole !== 0) return byRole;
    return left.user.name.localeCompare(right.user.name, 'pt-BR');
  });

const withSortedMembros = <
  T extends {
    membros: Array<{ papel: PapelOrganizacao; user: { name: string } }>;
  },
>(
  organizacao: T,
) => ({
  ...organizacao,
  membros: sortMembros(organizacao.membros),
});

const findWithMembros = async (organizacaoId: number) => {
  const organizacao = await prisma.organizacao.findUnique({
    where: { id: organizacaoId },
    include: { membros: true },
  });
  if (!organizacao) {
    throw new AppError(404, 'Organização não encontrada.');
  }
  return organizacao;
};

// admin do sistema passa. usuario comum so se o papel dele estiver na lista.
const assertCanManage = (
  actorRole: Role,
  actorPapel: PapelOrganizacao | undefined,
  allowed: PapelOrganizacao[],
  message: string,
) => {
  if (actorRole === 'ADMIN') return;
  if (!actorPapel || !allowed.includes(actorPapel)) {
    throw new AppError(403, message);
  }
};

// conta quantos ja tem aquele cargo. excludedUserId = quem ta mudando de papel, pra nao contar ele duas vezes.
const assertRoleCapacity = async (
  transaction: Prisma.TransactionClient,
  organizacaoId: number,
  papel: PapelOrganizacao,
  excludedUserId: number,
) => {
  if (papel !== 'GERENTE' && papel !== 'MODERADOR') return;
  const limit = LIMITE_POR_PAPEL[papel];

  const count = await transaction.organizacaoMembro.count({
    where: { organizacaoId, papel, userId: { not: excludedUserId } },
  });

  if (count >= limit) {
    throw new AppError(
      409,
      `Esta organização já possui o máximo de ${limit} ${ROTULO_LIMITE[papel]}(es).`,
    );
  }
};

export const organizacaoService = {
  // cria pendente e coloca o solicitante como criador. admin ainda precisa aceitar.
  async create(userId: number, nome: string) {
    const organizacao = await prisma.organizacao.create({
      data: {
        nome,
        status: 'PENDENTE',
        membros: { create: { userId, papel: 'CRIADOR' } },
      },
      include: organizacaoDetails,
    });
    return withSortedMembros(organizacao);
  },

  // tela do admin: todas as orgs.
  async getAll() {
    const organizacoes = await prisma.organizacao.findMany({
      orderBy: { id: 'desc' },
      include: organizacaoDetails,
    });
    return organizacoes.map(withSortedMembros);
  },

  // so as orgs em que o usuario e membro.
  async getMine(userId: number) {
    const organizacoes = await prisma.organizacao.findMany({
      where: { membros: { some: { userId } } },
      orderBy: { id: 'desc' },
      include: organizacaoDetails,
    });
    return organizacoes.map(withSortedMembros);
  },

  // relatorio do admin: agregados sobre todas as organizacoes.
  async getReport() {
    const organizacoes = await prisma.organizacao.findMany({
      select: reportSelect,
    });
    return buildOrganizacaoReport(organizacoes);
  },

  // relatorio do membro: mesmos agregados, so sobre as organizacoes das quais participa.
  async getReportMine(userId: number) {
    const organizacoes = await prisma.organizacao.findMany({
      where: { membros: { some: { userId } } },
      select: reportSelect,
    });
    return buildOrganizacaoReport(organizacoes);
  },

  // so membro da org (ou admin da plataforma) ve o detalhe.
  async getById(id: number, actorId: number, actorRole: Role) {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id },
      include: organizacaoDetails,
    });
    if (!organizacao) {
      throw new AppError(404, 'Organização não encontrada.');
    }
    if (
      actorRole !== 'ADMIN' &&
      !organizacao.membros.some((membro) => membro.userId === actorId)
    ) {
      throw new AppError(403, 'Você não é membro desta organização.');
    }
    return withSortedMembros(organizacao);
  },

  // renomear: criador, gerente ou admin da plataforma.
  async update(id: number, actorId: number, actorRole: Role, nome: string) {
    const organizacao = await findWithMembros(id);

    const actor = organizacao.membros.find(
      (membro) => membro.userId === actorId,
    );
    assertCanManage(
      actorRole,
      actor?.papel,
      ['CRIADOR', 'GERENTE'],
      'Somente o criador ou o gerente pode editar a organização.',
    );

    const updated = await prisma.organizacao.update({
      where: { id },
      data: { nome },
      include: organizacaoDetails,
    });
    return withSortedMembros(updated);
  },

  // admin aceita ou recusa. criador ja existe, so muda o status.
  async updateStatus(id: number, status: StatusOrganizacao) {
    try {
      const organizacao = await prisma.organizacao.update({
        where: { id },
        data: { status },
        include: organizacaoDetails,
      });
      return withSortedMembros(organizacao);
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Organização não encontrada.');
      }
      throw error;
    }
  },

  // so criador (ou admin da plataforma) apaga. remove comissao e membro junto.
  async delete(id: number, actorId: number, actorRole: Role) {
    const organizacao = await findWithMembros(id);

    const actor = organizacao.membros.find(
      (membro) => membro.userId === actorId,
    );
    if (actorRole !== 'ADMIN' && actor?.papel !== 'CRIADOR') {
      throw new AppError(403, 'Somente o criador pode excluir a organização.');
    }

    // membros, comissoes e equipes saem juntos pelo onDelete: Cascade do schema.
    await prisma.organizacao.delete({ where: { id } });
  },

  // org tem que estar aceita. criador/gerente/moderador convida. entra sempre como membro.
  async addMember(
    organizacaoId: number,
    actorId: number,
    actorRole: Role,
    email: string,
  ) {
    const organizacao = await prisma.organizacao.findUnique({
      where: { id: organizacaoId },
      include: { membros: true },
    });
    if (!organizacao || organizacao.status !== 'ACEITA') {
      throw new AppError(404, 'Organização aprovada não encontrada.');
    }

    const actor = organizacao.membros.find(
      (membro) => membro.userId === actorId,
    );
    assertCanManage(
      actorRole,
      actor?.papel,
      ['CRIADOR', 'GERENTE', 'MODERADOR'],
      'Somente criador, gerente ou moderador pode adicionar membros.',
    );

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      throw new AppError(
        404,
        'Usuário não encontrado. A pessoa precisa criar uma conta primeiro.',
      );
    }

    try {
      return await prisma.organizacaoMembro.create({
        data: { organizacaoId, userId: user.id, papel: 'MEMBRO' },
        include: membroUserSelect,
      });
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
        throw new AppError(409, 'Este usuário já é membro da organização.');
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
    actorRole: Role,
    memberId: number,
    papel: PapelOrganizacao,
  ) {
    const organizacao = await findWithMembros(organizacaoId);

    const actor = organizacao.membros.find(
      (membro) => membro.userId === actorId,
    );
    assertCanManage(
      actorRole,
      actor?.papel,
      ['CRIADOR'],
      'Somente o criador pode promover ou rebaixar membros.',
    );

    if (papel === 'CRIADOR' && actor?.papel !== 'CRIADOR') {
      throw new AppError(400, 'Não é possível atribuir o papel de criador.');
    }

    const target = organizacao.membros.find(
      (membro) => membro.userId === memberId,
    );
    if (!target) {
      throw new AppError(404, 'Membro não encontrado.');
    }
    if (target.papel === 'CRIADOR') {
      throw new AppError(400, 'O criador não pode ter o papel alterado.');
    }
    if (memberId === actorId && actorRole !== 'ADMIN') {
      throw new AppError(400, 'Você não pode alterar o próprio papel.');
    }

    return prisma.$transaction(async (transaction) => {
      await assertRoleCapacity(transaction, organizacaoId, papel, memberId);
      const updatedMembro = await transaction.organizacaoMembro.update({
        where: { organizacaoId_userId: { organizacaoId, userId: memberId } },
        data: { papel },
        include: membroUserSelect,
      });

      if (papel === 'CRIADOR') {
        await transaction.organizacaoMembro.update({
          where: { organizacaoId_userId: { organizacaoId, userId: actorId } },
          data: { papel: 'MEMBRO' },
        });
      }

      return updatedMembro;
    });
  },

  // criador e gerente removem usuario. o criador nao pode ser removido.
  async removeMember(
    organizacaoId: number,
    actorId: number,
    actorRole: Role,
    memberId: number,
  ) {
    const organizacao = await findWithMembros(organizacaoId);

    const actor = organizacao.membros.find(
      (membro) => membro.userId === actorId,
    );
    assertCanManage(
      actorRole,
      actor?.papel,
      ['CRIADOR', 'GERENTE'],
      'Somente o criador ou o gerente pode remover membros.',
    );

    const target = organizacao.membros.find(
      (membro) => membro.userId === memberId,
    );
    if (!target) {
      throw new AppError(404, 'Membro não encontrado.');
    }
    if (target.papel === 'CRIADOR') {
      throw new AppError(
        400,
        'O criador não pode ser removido da organização.',
      );
    }

    await prisma.organizacaoMembro.delete({
      where: { organizacaoId_userId: { organizacaoId, userId: memberId } },
    });
  },
};
