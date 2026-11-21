import {
  Tema,
  type PapelComissao,
  type Role,
  type PapelOrganizacao,
  type Prisma,
} from '@prisma/client';
import { APIError } from 'better-auth/api';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { auth } from '../lib/auth.ts';
import { emailService } from './emailService.ts';
import { countByMonth } from '../utils/monthlyGrowth.ts';
import { PRISMA_ERROR, isPrismaError } from '../utils/prismaErrors.ts';
import { hashSenha } from '../utils/senhaLegada.ts';

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
  emailVerified: true,
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

// =====================================================================
// Administração da plataforma na exclusão de conta
//
// A plataforma nunca fica sem administrador (EX-18). Se quem sai é o único
// ADMIN, precisa vir em `novoAdministradorId` o usuário escolhido por ele,
// que é promovido na mesma transação da exclusão. A contagem fica dentro da
// transação pelo mesmo motivo do updateRole: duas saídas simultâneas não
// podem zerar os administradores.
// Devolve quem foi promovido (para o e-mail de aviso), ou null.
// =====================================================================
const ADMINISTRADOR_PENDENTE =
  'Você é o único administrador da plataforma. Escolha quem vai assumir a administração antes de continuar.';

const transferirAdministracao = async (
  transaction: Prisma.TransactionClient,
  userId: number,
  novoAdministradorId: number | undefined,
) => {
  const user = await transaction.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true },
  });
  if (!user) {
    throw new AppError(404, 'Usuário não encontrado.');
  }
  if (user.role !== 'ADMIN') return null;

  const outrosAdmins = await transaction.user.count({
    where: { role: 'ADMIN', id: { not: userId } },
  });
  if (outrosAdmins > 0) return null;

  const novoAdministrador =
    novoAdministradorId !== undefined && novoAdministradorId !== userId
      ? await transaction.user.findUnique({
          where: { id: novoAdministradorId },
          select: userResumoSelect,
        })
      : null;
  if (!novoAdministrador) {
    throw new AppError(409, ADMINISTRADOR_PENDENTE, {
      administradorPendente: true,
    });
  }

  await transaction.user.update({
    where: { id: novoAdministrador.id },
    data: { role: 'ADMIN' },
  });
  return { novoAdministrador, anterior: user.name };
};

// o e-mail só sai depois que a transação foi confirmada.
const avisarNovoAdministrador = (
  transferencia: Awaited<ReturnType<typeof transferirAdministracao>>,
) => {
  if (!transferencia) return;
  const { novoAdministrador, anterior } = transferencia;
  emailService.runInBackground(() =>
    emailService.sendNovoAdministrador(
      { nome: novoAdministrador.name, email: novoAdministrador.email },
      anterior,
    ),
  );
};

const DADOS_VINCULADOS =
  'Não foi possível excluir sua conta por dados ainda vinculados a ela.';

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
    // A autoria de reunião e votação vira nula (SetNull), então só um vínculo
    // inesperado chega aqui: responde 409 em vez de 500.
    if (isPrismaError(error, PRISMA_ERROR.FOREIGN_KEY_VIOLATION)) {
      throw new AppError(409, DADOS_VINCULADOS);
    }
    throw error;
  }
};

export const usuarioService = {
  /**
   * Cria o administrador da plataforma configurado no .env, mas só quando não
   * existe nenhum ADMIN. Com ao menos um, não grava nada: quem foi rebaixado
   * não volta a ser promovido por reiniciar a API. Nunca altera conta existente
   * nem sobrescreve senha.
   */
  async ensureDefaultAdmin() {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
      console.warn(
        'ADMIN_EMAIL/ADMIN_PASSWORD não definidos: administrador padrão não foi verificado.',
      );
      return;
    }

    if ((await prisma.user.count({ where: { role: 'ADMIN' } })) > 0) return;

    const email = env.ADMIN_EMAIL.toLowerCase();
    const existente = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existente) {
      console.warn(
        `Não há administrador e já existe uma conta com ${email}. Promova-a por outro meio: o administrador padrão não altera contas existentes.`,
      );
      return;
    }

    const senhaHash = await hashSenha(env.ADMIN_PASSWORD);
    try {
      await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            name: 'Administrador',
            email,
            role: 'ADMIN',
            emailVerified: true,
            themePreference: 'system',
          },
          select: { id: true },
        });
        await transaction.account.create({
          data: {
            userId: user.id,
            accountId: String(user.id),
            providerId: 'credential',
            password: senhaHash,
          },
        });
      });
      console.log(`Administrador padrão criado: ${email}`);
    } catch (error) {
      // outro processo criou a conta primeiro: nada a fazer.
      if (isPrismaError(error, PRISMA_ERROR.UNIQUE_VIOLATION)) return;
      throw error;
    }
  },

  // Perfil da própria pessoa; é o que monitoring e gestão usam para validar a sessão.
  async getMe(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    });
    if (!user) {
      throw new AppError(401, 'Sessão inválida. Entre novamente.');
    }
    return user;
  },

  async updatePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
    headers: Headers,
  ) {
    if (currentPassword === newPassword) {
      throw new AppError(400, 'A nova senha deve ser diferente da atual.');
    }

    // Trocar a senha encerra todas as sessões e abre uma nova para quem trocou;
    // o token novo sai em set-auth-token e precisa substituir o antigo no cliente.
    let novoToken: string | null;
    try {
      const { headers: respostaHeaders } = await auth.api.changePassword({
        body: { currentPassword, newPassword, revokeOtherSessions: true },
        headers,
        returnHeaders: true,
      });
      novoToken = respostaHeaders.get('set-auth-token');
    } catch (error) {
      if (
        error instanceof APIError &&
        error.body?.code === 'INVALID_PASSWORD'
      ) {
        throw new AppError(401, 'Senha atual incorreta.');
      }
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userResumoSelect,
    });
    if (user) {
      emailService.runInBackground(() =>
        emailService.enviarAvisoSenhaAlterada({
          nome: user.name,
          email: user.email,
        }),
      );
    }
    return { token: novoToken };
  },

  // O nome é gravado na hora. O e-mail novo só vale depois de confirmado por
  // link enviado a ele (Better Auth); até lá o antigo continua sendo o login.
  async updateProfile(
    userId: number,
    { nome, email }: PerfilData,
    headers: Headers,
  ) {
    const atual = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!atual) {
      throw new AppError(404, 'Usuário não encontrado.');
    }

    const trocaEmail = email !== atual.email;
    if (trocaEmail) {
      const outraConta = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (outraConta) {
        throw new AppError(409, 'Este e-mail já está cadastrado.');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: nome },
      select: userPublicSelect,
    });
    if (trocaEmail) {
      await auth.api.changeEmail({ body: { newEmail: email }, headers });
    }
    return { ...user, emailConfirmacaoPendente: trocaEmail };
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

  /**
   * Promove ou rebaixa outra pessoa na plataforma (ação de administrador).
   * Ninguém altera o próprio perfil por aqui, para não perder o acesso no meio
   * do uso, e a plataforma nunca fica sem administrador (EX-18).
   */
  async updateRole(actorId: number, userId: number, role: Role) {
    if (actorId === userId) {
      throw new AppError(403, 'Você não pode alterar o seu próprio perfil.');
    }

    // a contagem de administradores fica na mesma transação da gravação,
    // para dois rebaixamentos simultâneos não zerarem os administradores.
    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!user) {
        throw new AppError(404, 'Usuário não encontrado.');
      }

      if (user.role === 'ADMIN' && role !== 'ADMIN') {
        const outrosAdmins = await transaction.user.count({
          where: { role: 'ADMIN', id: { not: userId } },
        });
        if (outrosAdmins === 0) {
          throw new AppError(
            409,
            'Este é o único administrador da plataforma. Promova outra pessoa antes de rebaixá-lo.',
          );
        }
      }

      return transaction.user.update({
        where: { id: userId },
        data: { role },
        select: userPublicSelect,
      });
    });
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

  // se o usuário é o único ADMIN; a tela de exclusão pede quem assume no lugar dele.
  async isUnicoAdministrador(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') return false;
    const outrosAdmins = await prisma.user.count({
      where: { role: 'ADMIN', id: { not: userId } },
    });
    return outrosAdmins === 0;
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
   * lista pra a tela mostrar o modal antes de tentar de novo. Se ele for o
   * único administrador da plataforma, ver transferirAdministracao.
   */
  async deletePersonalData(
    userId: number,
    sucessores: Sucessores,
    sucessoresComissao: Sucessores,
    novoAdministradorId?: number,
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
    const transferencia = await prisma.$transaction(async (transaction) => {
      const administracao = await transferirAdministracao(
        transaction,
        userId,
        novoAdministradorId,
      );
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
      return administracao;
    });
    avisarNovoAdministrador(transferencia);
  },

  /**
   * Exclui os dados pessoais + as organizações das quais o usuário é criador
   * e seus dados filhos. Comissões de outras organizações em que ele é
   * administrador seguem resolverComissoesAdministradas, e a administração da
   * plataforma segue transferirAdministracao.
   */
  async deleteFullAccount(
    userId: number,
    sucessoresComissao: Sucessores,
    novoAdministradorId?: number,
  ) {
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

    const transferencia = await prisma.$transaction(async (transaction) => {
      const administracao = await transferirAdministracao(
        transaction,
        userId,
        novoAdministradorId,
      );
      await aplicarComissoesAdministradas(transaction, comissoes);
      if (organizacaoIds.length > 0) {
        // membros, comissões e equipes saem juntos pelo onDelete: Cascade do schema.
        await transaction.organizacao.deleteMany({
          where: { id: { in: organizacaoIds } },
        });
      }
      await deleteUser(transaction, userId);
      return administracao;
    });
    avisarNovoAdministrador(transferencia);
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
