import {
  Tema,
  type PapelComissao,
  type PapelOrganizacao,
  type Prisma,
} from '@prisma/client';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { countByMonth } from '../utils/monthlyGrowth.ts';
import { hashPassword, verifyPassword } from '../utils/passwordHash.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';

type CadastroUsuarioData = { nome: string; email: string; password: string };
type PerfilData = { nome: string; email: string };
// id da organização/comissão -> id de quem assume no lugar do usuário
type Sucessores = Record<string, number>;

// quantos usuarios entram no ranking de mais ativos.
const TOP_ATIVOS = 5;

// limite da busca de usuários; quem não aparece refina o termo.
const MAX_RESULTADOS_BUSCA = 10;

// papeis "de responsabilidade" que o relatorio destaca.
const PAPEIS_ORG_DESTAQUE = [
  'CRIADOR',
  'GERENTE',
  'MODERADOR',
] as const satisfies readonly PapelOrganizacao[];
const PAPEIS_COMISSAO_DESTAQUE = [
  'ADMINISTRADOR',
  'FACILITADOR',
  'SECRETARIO',
] as const satisfies readonly PapelComissao[];

export const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  themePreference: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

const userResumoSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const reportSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  themePreference: true,
  organizacoes: {
    select: { papel: true, organizacao: { select: { id: true, nome: true } } },
  },
  comissoes: {
    select: { papel: true, comissao: { select: { id: true, nome: true } } },
  },
} satisfies Prisma.UserSelect;

type ComissaoPendente = {
  id: number;
  nome: string;
  organizacaoId: number;
  membros: { id: number; name: string; email: string }[];
};

type OrganizacaoPendente = {
  id: number;
  nome: string;
  membros: { id: number; name: string; email: string }[];
};

const zeroPor = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;

const isOneOf = <T extends string>(
  list: readonly T[],
  value: string,
): value is T => (list as readonly string[]).includes(value);

// =====================================================================
// Comissões na exclusão de conta
//
// As permissões de comissão vêm só de ComissaoEquipe (nem o criador da
// organização mexe numa comissão sem estar na equipe). Então, se o usuário
// é o único ADMINISTRADOR de uma comissão, ela ficaria sem ninguém que possa
// excluí-la. Para cada comissão em que ele é ADMINISTRADOR:
//   - se já existe outro ADMINISTRADOR, nada muda;
//   - se não sobra ninguém na equipe, a comissão é apagada junto (a tela
//     mostra um aviso antes);
//   - senão, precisa vir um sucessor escolhido em `sucessoresComissao[comissaoId]`
//     (não há promoção automática, nem de FACILITADOR).
// `organizacaoIdsExcluidas` = organizações que vão ser apagadas inteiras
// (exclusão completa); as comissões delas somem junto e não entram aqui.
// =====================================================================
const resolverComissoesAdministradas = async (
  userId: number,
  sucessoresComissao: Sucessores,
  organizacaoIdsExcluidas: number[] = [],
) => {
  const administradorEm = await prisma.comissaoEquipe.findMany({
    where: {
      userId,
      papel: 'ADMINISTRADOR',
      comissao: { organizacaoId: { notIn: organizacaoIdsExcluidas } },
    },
    include: {
      comissao: {
        include: {
          equipe: { include: { user: { select: userResumoSelect } } },
        },
      },
    },
  });

  const comissoesPendentes: ComissaoPendente[] = [];
  const promocoes: Array<{ comissaoId: number; novoAdministradorId: number }> =
    [];
  const comissoesVazias: number[] = [];

  for (const { comissao } of administradorEm) {
    const outrosMembros = comissao.equipe.filter((m) => m.userId !== userId);

    if (outrosMembros.some((m) => m.papel === 'ADMINISTRADOR')) continue;

    if (outrosMembros.length === 0) {
      comissoesVazias.push(comissao.id);
      continue;
    }

    const sucessorId = sucessoresComissao[comissao.id];
    if (
      sucessorId !== undefined &&
      outrosMembros.some((m) => m.userId === sucessorId)
    ) {
      promocoes.push({
        comissaoId: comissao.id,
        novoAdministradorId: sucessorId,
      });
      continue;
    }

    comissoesPendentes.push({
      id: comissao.id,
      nome: comissao.nome,
      organizacaoId: comissao.organizacaoId,
      membros: outrosMembros.map((m) => m.user),
    });
  }

  return { comissoesPendentes, promocoes, comissoesVazias };
};

// aplica o que resolverComissoesAdministradas decidiu, dentro da transação da exclusão.
const aplicarComissoesAdministradas = async (
  transaction: Prisma.TransactionClient,
  {
    promocoes,
    comissoesVazias,
  }: Awaited<ReturnType<typeof resolverComissoesAdministradas>>,
) => {
  for (const promocao of promocoes) {
    await transaction.comissaoEquipe.update({
      where: {
        comissaoId_userId: {
          comissaoId: promocao.comissaoId,
          userId: promocao.novoAdministradorId,
        },
      },
      data: { papel: 'ADMINISTRADOR' },
    });
  }
  if (comissoesVazias.length > 0) {
    // a equipe sai junto pelo onDelete: Cascade do schema.
    await transaction.comissao.deleteMany({
      where: { id: { in: comissoesVazias } },
    });
  }
};

// Para cada organização em que o usuário é CRIADOR, precisa vir um sucessor
// escolhido em `sucessores[organizacaoId]` (é o que preenche o modal "escolha
// quem fica no seu lugar" no app). Pode ser qualquer outro membro, inclusive o
// gerente — mas nunca é automático: quem sai escolhe.
const resolverOrganizacoesCriadas = async (
  userId: number,
  sucessores: Sucessores,
) => {
  const criadorEm = await prisma.organizacaoMembro.findMany({
    where: { userId, papel: 'CRIADOR' },
    include: {
      organizacao: {
        include: {
          membros: { include: { user: { select: userResumoSelect } } },
        },
      },
    },
  });

  const organizacoesPendentes: OrganizacaoPendente[] = [];
  const transferencias: Array<{
    organizacaoId: number;
    novoCriadorId: number;
  }> = [];

  for (const membro of criadorEm) {
    const outrosMembros = membro.organizacao.membros.filter(
      (m) => m.userId !== userId,
    );
    const sucessorId = sucessores[membro.organizacaoId];

    if (
      sucessorId !== undefined &&
      outrosMembros.some((m) => m.userId === sucessorId)
    ) {
      transferencias.push({
        organizacaoId: membro.organizacaoId,
        novoCriadorId: sucessorId,
      });
      continue;
    }

    organizacoesPendentes.push({
      id: membro.organizacao.id,
      nome: membro.organizacao.nome,
      membros: outrosMembros.map((m) => m.user),
    });
  }

  return { organizacoesPendentes, transferencias };
};

const deleteUser = async (
  transaction: Prisma.TransactionClient,
  userId: number,
) => {
  try {
    await transaction.user.delete({ where: { id: userId } });
  } catch (error) {
    if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
      throw new AppError(404, 'Usuário não encontrado.');
    }
    throw error;
  }
};

export const usuarioService = {
  /**
   * Garante que o administrador da plataforma configurado no .env exista.
   * Só cria a conta (ou devolve o papel ADMIN); nunca sobrescreve a senha de
   * uma conta existente. Sem ADMIN_EMAIL/ADMIN_PASSWORD, não faz nada.
   */
  async ensureDefaultAdmin() {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      console.warn(
        'ADMIN_EMAIL/ADMIN_PASSWORD não definidos: administrador padrão não foi verificado.',
      );
      return;
    }

    const email = env.ADMIN_EMAIL.toLowerCase();
    await prisma.user.upsert({
      where: { email },
      update: { role: 'ADMIN' },
      create: {
        name: 'Administrador',
        email,
        password: hashPassword(env.ADMIN_PASSWORD),
        role: 'ADMIN',
      },
    });
    console.log(`Administrador padrão verificado: ${email}`);
  },

  async create({ nome, email, password }: CadastroUsuarioData) {
    try {
      return await prisma.user.create({
        data: {
          name: nome,
          email,
          password: hashPassword(password),
          role: 'USER',
          themePreference: 'system',
        },
        select: userPublicSelect,
      });
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
        throw new AppError(409, 'Este e-mail já está cadastrado.');
      }
      throw error;
    }
  },

  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      throw new AppError(404, 'Usuário não encontrado.');
    }
    if (!verifyPassword(currentPassword, user.password)) {
      throw new AppError(401, 'Senha atual incorreta.');
    }
    if (currentPassword === newPassword) {
      throw new AppError(400, 'A nova senha deve ser diferente da atual.');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    });
  },

  async updateProfile(userId: number, { nome, email }: PerfilData) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { name: nome, email },
        select: userPublicSelect,
      });
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) {
        throw new AppError(409, 'Este e-mail já está em uso.');
      }
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Usuário não encontrado.');
      }
      throw error;
    }
  },

  async updateTheme(userId: number, theme: Tema) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { themePreference: theme },
        select: { id: true, themePreference: true },
      });
    } catch (error) {
      if (isPrismaError(error, PRISMA_ERROR.RECORD_NOT_FOUND)) {
        throw new AppError(404, 'Usuário não encontrado.');
      }
      throw error;
    }
  },

  // busca por trecho do nome ou do e-mail. A collation padrão do MySQL já
  // ignora caixa e acento no contains.
  async search(termo: string, organizacaoId?: number) {
    return prisma.user.findMany({
      where: {
        OR: [{ name: { contains: termo } }, { email: { contains: termo } }],
        ...(organizacaoId ? { organizacoes: { none: { organizacaoId } } } : {}),
      },
      orderBy: { name: 'asc' },
      take: MAX_RESULTADOS_BUSCA,
      select: userResumoSelect,
    });
  },

  // comissões em que o usuário é ADMINISTRADOR, com a equipe, pra tela de
  // exclusão decidir quem assume cada uma.
  async getComissoesAdministradas(userId: number) {
    return prisma.comissao.findMany({
      where: { equipe: { some: { userId, papel: 'ADMINISTRADOR' } } },
      orderBy: { nome: 'asc' },
      include: {
        organizacao: { select: { id: true, nome: true } },
        equipe: { include: { user: { select: userResumoSelect } } },
      },
    });
  },

  /**
   * Exclui os dados pessoais do usuário, mantendo as organizações das quais
   * ele é criador (cada uma passa para o sucessor escolhido).
   * Se sobrar alguma organização ou comissão sem sucessor, lança 409 com a
   * lista pra a tela mostrar o modal antes de tentar de novo.
   */
  async deletePersonalData(
    userId: number,
    sucessores: Sucessores,
    sucessoresComissao: Sucessores,
  ) {
    const organizacoes = await resolverOrganizacoesCriadas(userId, sucessores);
    // Comissões em que ele é ADMINISTRADOR: ver resolverComissoesAdministradas.
    const comissoes = await resolverComissoesAdministradas(
      userId,
      sucessoresComissao,
    );

    if (
      organizacoes.organizacoesPendentes.length > 0 ||
      comissoes.comissoesPendentes.length > 0
    ) {
      throw new AppError(
        409,
        'Escolha quem vai assumir cada organização e comissão listada antes de continuar.',
        {
          organizacoesPendentes: organizacoes.organizacoesPendentes,
          comissoesPendentes: comissoes.comissoesPendentes,
        },
      );
    }

    // Transferências e exclusão juntas: se a exclusão falhar, ninguém vira
    // criador de uma organização que o usuário ainda tem.
    await prisma.$transaction(async (transaction) => {
      for (const {
        organizacaoId,
        novoCriadorId,
      } of organizacoes.transferencias) {
        await transaction.organizacaoMembro.update({
          where: {
            organizacaoId_userId: { organizacaoId, userId: novoCriadorId },
          },
          data: { papel: 'CRIADOR' },
        });
      }
      await aplicarComissoesAdministradas(transaction, comissoes);
      // o vínculo de criador do próprio usuário sai pelo onDelete: Cascade.
      await deleteUser(transaction, userId);
    });
  },

  /**
   * Exclui os dados pessoais + as organizações das quais o usuário é criador
   * e seus dados filhos. Comissões de outras organizações em que ele é
   * administrador seguem resolverComissoesAdministradas.
   */
  async deleteFullAccount(userId: number, sucessoresComissao: Sucessores) {
    const organizacoesCriador = await prisma.organizacaoMembro.findMany({
      where: { userId, papel: 'CRIADOR' },
      select: { organizacaoId: true },
    });
    const organizacaoIds = organizacoesCriador.map(
      (membro) => membro.organizacaoId,
    );

    // comissões de outras organizações (que não vão ser apagadas) em que ele é administrador.
    const comissoes = await resolverComissoesAdministradas(
      userId,
      sucessoresComissao,
      organizacaoIds,
    );
    if (comissoes.comissoesPendentes.length > 0) {
      throw new AppError(
        409,
        'Escolha quem vai assumir como administrador de cada comissão listada antes de continuar.',
        { comissoesPendentes: comissoes.comissoesPendentes },
      );
    }

    await prisma.$transaction(async (transaction) => {
      await aplicarComissoesAdministradas(transaction, comissoes);
      if (organizacaoIds.length > 0) {
        // membros, comissões e equipes saem juntos pelo onDelete: Cascade do schema.
        await transaction.organizacao.deleteMany({
          where: { id: { in: organizacaoIds } },
        });
      }
      await deleteUser(transaction, userId);
    });
  },

  // relatorio do admin: agregados sobre todos os usuarios da plataforma.
  async getReport() {
    const usuarios = await prisma.user.findMany({
      select: reportSelect,
      orderBy: { createdAt: 'desc' },
    });

    const porRole = { ADMIN: 0, USER: 0 };
    const porTema = zeroPor(Object.values(Tema));
    // quantos usuarios distintos tem cada papel em pelo menos uma org/comissao.
    const usuariosPorPapelOrganizacao = zeroPor(PAPEIS_ORG_DESTAQUE);
    const usuariosPorPapelComissao = zeroPor(PAPEIS_COMISSAO_DESTAQUE);
    let comOrganizacao = 0;
    let comComissao = 0;
    let totalVinculosOrganizacao = 0;
    let totalVinculosComissao = 0;

    for (const usuario of usuarios) {
      porRole[usuario.role] += 1;

      // null = segue o sistema (default do schema).
      porTema[usuario.themePreference ?? 'system'] += 1;

      if (usuario.organizacoes.length > 0) comOrganizacao += 1;
      if (usuario.comissoes.length > 0) comComissao += 1;
      totalVinculosOrganizacao += usuario.organizacoes.length;
      totalVinculosComissao += usuario.comissoes.length;

      for (const papel of new Set(
        usuario.organizacoes.map((vinculo) => vinculo.papel),
      )) {
        if (isOneOf(PAPEIS_ORG_DESTAQUE, papel))
          usuariosPorPapelOrganizacao[papel] += 1;
      }
      for (const papel of new Set(
        usuario.comissoes.map((vinculo) => vinculo.papel),
      )) {
        if (isOneOf(PAPEIS_COMISSAO_DESTAQUE, papel))
          usuariosPorPapelComissao[papel] += 1;
      }
    }

    const total = usuarios.length;
    const ranking = usuarios
      .map((usuario) => ({
        id: usuario.id,
        name: usuario.name,
        organizacoes: usuario.organizacoes.length,
        comissoes: usuario.comissoes.length,
      }))
      .filter((usuario) => usuario.organizacoes + usuario.comissoes > 0)
      .sort(
        (a, b) => b.organizacoes + b.comissoes - (a.organizacoes + a.comissoes),
      )
      .slice(0, TOP_ATIVOS);

    return {
      total,
      porRole,
      crescimentoPorMes: countByMonth(
        usuarios.map((usuario) => usuario.createdAt),
      ),
      engajamento: {
        comOrganizacao,
        semOrganizacao: total - comOrganizacao,
        comComissao,
        mediaOrganizacoesPorUsuario:
          total > 0 ? totalVinculosOrganizacao / total : 0,
        mediaComissoesPorUsuario: total > 0 ? totalVinculosComissao / total : 0,
      },
      usuariosPorPapelOrganizacao,
      usuariosPorPapelComissao,
      maisAtivos: ranking,
      porTema,
      usuarios: usuarios.map((usuario) => ({
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        createdAt: usuario.createdAt,
        organizacoes: usuario.organizacoes.map((vinculo) => ({
          ...vinculo.organizacao,
          papel: vinculo.papel,
        })),
        comissoes: usuario.comissoes.map((vinculo) => ({
          ...vinculo.comissao,
          papel: vinculo.papel,
        })),
      })),
    };
  },
};
