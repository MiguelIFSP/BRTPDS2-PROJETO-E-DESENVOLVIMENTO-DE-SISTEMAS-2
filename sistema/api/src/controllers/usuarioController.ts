// =====================================================================
// usuarioController.ts
// Contém os controllers de:
//   - create         (já existia) - cadastro de usuário
//   - updatePassword (já existia) - troca de senha  (UC01)
//   - updateProfile  (NOVO)       - alteração de dados pessoais (UC03)
//   - updateTheme    (NOVO)       - alteração do tema preferido  (UC04)
// =====================================================================

import crypto from 'crypto';
import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import prisma from '../config/database.ts';
import type { AuthenticatedRequest } from '../middlewares/auth.ts';
import { OrganizacaoError, organizacaoService } from '../services/organizacaoService.ts';
import { usuarioService } from '../services/usuarioService.ts';

// ---------------------------------------------------------------------
// Constantes do administrador padrão
// ---------------------------------------------------------------------
const DEFAULT_ADMIN_EMAIL = 'admin@bettermeet.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_ADMIN_PASSWORD_HASH = crypto
  .createHash('sha256')
  .update(DEFAULT_ADMIN_PASSWORD)
  .digest('hex');

// =====================================================================
// SCHEMAS DE VALIDAÇÃO (Yup)
// =====================================================================

// Cadastro (create)
const userSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('O nome completo é obrigatório.')
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),
  email: yup
    .string()
    .trim()
    .required('O e-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.'),
  password: yup
    .string()
    .required('A senha é obrigatória.')
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A senha deve ter no máximo 72 caracteres.')
    .matches(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
    .matches(/[0-9]/, 'A senha deve conter pelo menos um número.'),
  role: yup
    .string()
    .oneOf(['USER'], 'A criação de administrador é restrita ao sistema.')
    .default('USER'),
});

// Troca de senha (updatePassword)
const passwordUpdateSchema = yup.object({
  currentPassword: yup.string().required('A senha atual é obrigatória.'),
  newPassword: yup
    .string()
    .required('A nova senha é obrigatória.')
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A nova senha deve ter no máximo 72 caracteres.')
    .matches(/[A-Z]/, 'A nova senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[a-z]/, 'A nova senha deve conter pelo menos uma letra minúscula.')
    .matches(/[0-9]/, 'A nova senha deve conter pelo menos um número.'),
});

// Alteração de dados pessoais (updateProfile — UC03)
const profileUpdateSchema = yup.object({
  nome: yup
    .string()
    .trim()
    .required('O nome completo é obrigatório.')
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),
  email: yup
    .string()
    .trim()
    .required('O e-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.'),
});

// Alteração de tema (updateTheme — UC04)
const themeUpdateSchema = yup.object({
  theme: yup
    .string()
    .oneOf(['light', 'dark', 'system'], 'Tema inválido. Use: light, dark ou system.')
    .required('Informe o tema desejado.'),
});

// =====================================================================
// ensureDefaultAdmin
// =====================================================================
export const ensureDefaultAdmin = async () => {
  await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {
      name: 'Administrador',
      password: DEFAULT_ADMIN_PASSWORD_HASH,
      role: 'ADMIN',
    },
    create: {
      name: 'Administrador',
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD_HASH,
      role: 'ADMIN',
    },
  });
};

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
  sucessoresComissao: Record<string, unknown>,
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
        include: { equipe: { include: { user: { select: { id: true, name: true, email: true } } } } },
      },
    },
  });

  const comissoesPendentes: Array<{
    id: number;
    nome: string;
    organizacaoId: number;
    membros: { id: number; name: string; email: string }[];
  }> = [];
  const promocoes: Array<{ comissaoId: number; novoAdministradorId: number }> = [];
  const comissoesVazias: number[] = [];

  for (const { comissao } of administradorEm) {
    const outrosMembros = comissao.equipe.filter((m) => m.userId !== userId);

    if (outrosMembros.some((m) => m.papel === 'ADMINISTRADOR')) continue;

    if (outrosMembros.length === 0) {
      comissoesVazias.push(comissao.id);
      continue;
    }

    const sucessorId = Number(sucessoresComissao[comissao.id]);
    if (Number.isInteger(sucessorId) && sucessorId > 0 && outrosMembros.some((m) => m.userId === sucessorId)) {
      promocoes.push({ comissaoId: comissao.id, novoAdministradorId: sucessorId });
      continue;
    }

    comissoesPendentes.push({
      id: comissao.id,
      nome: comissao.nome,
      organizacaoId: comissao.organizacaoId,
      membros: outrosMembros.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email })),
    });
  }

  return { comissoesPendentes, promocoes, comissoesVazias };
};

// aplica o que resolverComissoesAdministradas decidiu, dentro da transação da exclusão.
const aplicarComissoesAdministradas = async (
  transaction: Prisma.TransactionClient,
  { promocoes, comissoesVazias }: Awaited<ReturnType<typeof resolverComissoesAdministradas>>,
) => {
  for (const promocao of promocoes) {
    await transaction.comissaoEquipe.update({
      where: { comissaoId_userId: { comissaoId: promocao.comissaoId, userId: promocao.novoAdministradorId } },
      data: { papel: 'ADMINISTRADOR' },
    });
  }
  if (comissoesVazias.length > 0) {
    await transaction.comissaoEquipe.deleteMany({ where: { comissaoId: { in: comissoesVazias } } });
    await transaction.comissao.deleteMany({ where: { id: { in: comissoesVazias } } });
  }
};

// =====================================================================
// CONTROLLER
// =====================================================================
export const usuarioController = {
  // -------------------------------------------------------------------
  // create — Cadastro de novo usuário
  // -------------------------------------------------------------------
  async create(request: Request, response: Response) {
    try {
      const { nome, email, password, role } = await userSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (role !== 'USER') {
        response.status(403).json({ error: 'A criação de administrador é restrita ao sistema.' });
        return;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        response.status(409).json({ error: 'Este e-mail já está cadastrado.' });
        return;
      }

      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

      const user = await prisma.user.create({
        data: {
          name: nome,
          email: email.toLowerCase(),
          password: passwordHash,
          role,
          themePreference: 'system',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          themePreference: true,
          createdAt: true,
        },
      });

      response.status(201).json(user);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro ao criar usuário:', error);
      response.status(500).json({ error: 'Não foi possível criar o usuário.' });
    }
  },

  // -------------------------------------------------------------------
  // updatePassword — UC01 (Troca de Senha)
  // -------------------------------------------------------------------
  async updatePassword(request: Request, response: Response) {
    try {
      const userId = Number(request.params.id);
      const { currentPassword, newPassword } = await passwordUpdateSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (!Number.isInteger(userId) || userId <= 0) {
        response.status(400).json({ error: 'Identificador do usuário inválido.' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        response.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }

      const currentPasswordHash = crypto.createHash('sha256').update(currentPassword).digest('hex');

      if (user.password !== currentPasswordHash) {
        response.status(401).json({ error: 'Senha atual incorreta.' });
        return;
      }

      if (currentPassword === newPassword) {
        response.status(400).json({ error: 'A nova senha deve ser diferente da atual.' });
        return;
      }

      const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

      await prisma.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
      });

      response.status(200).json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro ao alterar senha:', error);
      response.status(500).json({ error: 'Não foi possível alterar a senha.' });
    }
  },

  // -------------------------------------------------------------------
  // updateProfile — UC03 (Alterar Dados Pessoais)
  // -------------------------------------------------------------------
  async updateProfile(request: Request, response: Response) {
    try {
      const { id: authenticatedUserId } = (request as AuthenticatedRequest).user;
      const userId = Number(request.params.id);

      if (userId !== authenticatedUserId) {
        response.status(403).json({ error: 'Você só pode editar a sua própria conta.' });
        return;
      }

      const { nome, email } = await profileUpdateSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const emailOwner = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailOwner && emailOwner.id !== userId) {
        response.status(409).json({ error: 'Este e-mail já está em uso.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { name: nome, email: email.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          themePreference: true,
          createdAt: true,
        },
      });

      response.status(200).json(updated);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro ao atualizar perfil:', error);
      response.status(500).json({ error: 'Não foi possível atualizar o perfil.' });
    }
  },

  // -------------------------------------------------------------------
  // updateTheme — UC04 (Tema Preferido)
  // -------------------------------------------------------------------
  async updateTheme(request: Request, response: Response) {
    try {
      const { id: authenticatedUserId } = (request as AuthenticatedRequest).user;
      const userId = Number(request.params.id);

      if (userId !== authenticatedUserId) {
        response.status(403).json({ error: 'Você só pode alterar o tema da sua própria conta.' });
        return;
      }

      const { theme } = await themeUpdateSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { themePreference: theme },
        select: { id: true, themePreference: true },
      });

      response.status(200).json(updated);
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro ao atualizar tema:', error);
      response.status(500).json({ error: 'Não foi possível atualizar o tema.' });
    }
  },

  // -------------------------------------------------------------------
  // getComissoesAdministradas — comissões em que o usuário é ADMINISTRADOR,
  // com a equipe, pra tela de exclusão decidir quem assume cada uma.
  // -------------------------------------------------------------------
  async getComissoesAdministradas(request: Request, response: Response) {
    try {
      const { id: authenticatedUserId } = (request as AuthenticatedRequest).user;
      const userId = Number(request.params.id);

      if (userId !== authenticatedUserId) {
        response.status(403).json({ error: 'Você só pode consultar a sua própria conta.' });
        return;
      }

      const comissoes = await prisma.comissao.findMany({
        where: { equipe: { some: { userId, papel: 'ADMINISTRADOR' } } },
        orderBy: { nome: 'asc' },
        include: {
          organizacao: { select: { id: true, nome: true } },
          equipe: { include: { user: { select: { id: true, name: true, email: true } } } },
        },
      });

      response.status(200).json(comissoes);
    } catch (error) {
      console.error('Erro ao buscar comissões administradas:', error);
      response.status(500).json({ error: 'Não foi possível carregar suas comissões.' });
    }
  },

  // -------------------------------------------------------------------
  // deletePersonalData — Exclusão de dados pessoais (tela de exclusão de dados)
  //
  // Para cada organização em que o usuário é CRIADOR, precisa vir um sucessor
  // escolhido em `sucessores[organizacaoId]` (é o que preenche o modal "escolha
  // quem fica no seu lugar" no app). Pode ser qualquer outro membro, inclusive o
  // gerente — mas nunca é automático: quem sai escolhe.
  // Se sobrar alguma organização sem sucessor informado, devolve 409 com a lista
  // pra a tela mostrar o modal antes de tentar de novo.
  // Comissões em que ele é ADMINISTRADOR: ver resolverComissoesAdministradas.
  // -------------------------------------------------------------------
  async deletePersonalData(request: Request, response: Response) {
    try {
      const { id: authenticatedUserId } = (request as AuthenticatedRequest).user;
      const userId = Number(request.params.id);

      if (userId !== authenticatedUserId) {
        response.status(403).json({ error: 'Você só pode excluir os dados da sua própria conta.' });
        return;
      }

      // `sucessores` é um mapa dinâmico organizacaoId -> novoCriadorId. Não dá pra
      // validar com yup.object({ stripUnknown: true }) porque, sem um shape
      // declarado, o yup trata toda chave como "desconhecida" e apaga o mapa
      // inteiro. Cada valor é conferido individualmente logo abaixo (precisa ser
      // um membro de fato da organização), então ler direto do body é seguro.
      const sucessores = (request.body?.sucessores ?? {}) as Record<string, unknown>;
      // mesmo formato, comissaoId -> novoAdministradorId (ver resolverComissoesAdministradas).
      const sucessoresComissao = (request.body?.sucessoresComissao ?? {}) as Record<string, unknown>;

      const criadorEm = await prisma.organizacaoMembro.findMany({
        where: { userId, papel: 'CRIADOR' },
        include: {
          organizacao: {
            include: { membros: { include: { user: { select: { id: true, name: true, email: true } } } } },
          },
        },
      });

      const organizacoesPendentes: Array<{
        id: number;
        nome: string;
        membros: { id: number; name: string; email: string }[];
      }> = [];
      const transferencias: Array<{ organizacaoId: number; novoCriadorId: number }> = [];

      for (const membro of criadorEm) {
        const outrosMembros = membro.organizacao.membros.filter((m) => m.userId !== userId);
        const sucessorId = Number(sucessores[membro.organizacaoId]);
        const sucessorValido = outrosMembros.some((m) => m.userId === sucessorId);

        if (Number.isInteger(sucessorId) && sucessorId > 0 && sucessorValido) {
          transferencias.push({ organizacaoId: membro.organizacaoId, novoCriadorId: sucessorId });
          continue;
        }

        organizacoesPendentes.push({
          id: membro.organizacao.id,
          nome: membro.organizacao.nome,
          membros: outrosMembros.map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email })),
        });
      }

      const comissoes = await resolverComissoesAdministradas(userId, sucessoresComissao);

      if (organizacoesPendentes.length > 0 || comissoes.comissoesPendentes.length > 0) {
        response.status(409).json({
          error: 'Escolha quem vai assumir cada organização e comissão listada antes de continuar.',
          organizacoesPendentes,
          comissoesPendentes: comissoes.comissoesPendentes,
        });
        return;
      }

      for (const transferencia of transferencias) {
        await organizacaoService.updateMemberRole(
          transferencia.organizacaoId,
          userId,
          'USER',
          transferencia.novoCriadorId,
          'CRIADOR',
        );
      }

      await prisma.$transaction(async (transaction) => {
        await aplicarComissoesAdministradas(transaction, comissoes);
        await transaction.user.delete({ where: { id: userId } });
      });

      response.status(200).json({ message: 'Seus dados pessoais foram excluídos com sucesso.' });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      if (error instanceof OrganizacaoError) {
        response.status(error.statusCode).json({ error: error.message });
        return;
      }
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        response.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
      console.error('Erro ao excluir dados pessoais:', error);
      response.status(500).json({ error: 'Não foi possível excluir seus dados pessoais.' });
    }
  },

  // -------------------------------------------------------------------
  // deleteFullAccount — Exclusão de dados pessoais + organizações das
  // quais o usuário é criador e seus dados filhos. Comissões de outras
  // organizações em que ele é administrador seguem resolverComissoesAdministradas.
  // -------------------------------------------------------------------
  async deleteFullAccount(request: Request, response: Response) {
    try {
      const { id: authenticatedUserId } = (request as AuthenticatedRequest).user;
      const userId = Number(request.params.id);

      if (userId !== authenticatedUserId) {
        response.status(403).json({ error: 'Você só pode excluir os dados da sua própria conta.' });
        return;
      }

      const sucessoresComissao = (request.body?.sucessoresComissao ?? {}) as Record<string, unknown>;

      const organizacoesCriador = await prisma.organizacaoMembro.findMany({
        where: { userId, papel: 'CRIADOR' },
        select: { organizacaoId: true },
      });
      const organizacaoIds = organizacoesCriador.map((membro) => membro.organizacaoId);

      // comissões de outras organizações (que não vão ser apagadas) em que ele é administrador.
      const comissoes = await resolverComissoesAdministradas(userId, sucessoresComissao, organizacaoIds);
      if (comissoes.comissoesPendentes.length > 0) {
        response.status(409).json({
          error: 'Escolha quem vai assumir como administrador de cada comissão listada antes de continuar.',
          comissoesPendentes: comissoes.comissoesPendentes,
        });
        return;
      }

      await prisma.$transaction(async (transaction) => {
        await aplicarComissoesAdministradas(transaction, comissoes);

        if (organizacaoIds.length > 0) {
          const comissoes = await transaction.comissao.findMany({
            where: { organizacaoId: { in: organizacaoIds } },
            select: { id: true },
          });
          const comissaoIds = comissoes.map((comissao) => comissao.id);

          await transaction.organizacaoMembro.deleteMany({ where: { organizacaoId: { in: organizacaoIds } } });
          if (comissaoIds.length > 0) {
            await transaction.comissaoEquipe.deleteMany({ where: { comissaoId: { in: comissaoIds } } });
            await transaction.comissao.deleteMany({ where: { id: { in: comissaoIds } } });
          }
          await transaction.organizacao.deleteMany({ where: { id: { in: organizacaoIds } } });
        }

        await transaction.user.delete({ where: { id: userId } });
      });

      response.status(200).json({ message: 'Sua conta e suas organizações foram excluídas com sucesso.' });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        response.status(404).json({ error: 'Usuário não encontrado.' });
        return;
      }
      console.error('Erro ao excluir conta completa:', error);
      response.status(500).json({ error: 'Não foi possível excluir sua conta.' });
    }
  },

  // -------------------------------------------------------------------
  // getReport — relatório de usuários (somente admin)
  // -------------------------------------------------------------------
  async getReport(_request: Request, response: Response) {
    try {
      const report = await usuarioService.getReport();
      response.status(200).json(report);
    } catch (error) {
      console.error('Erro ao gerar relatório de usuários:', error);
      response.status(500).json({ error: 'Não foi possível gerar o relatório de usuários.' });
    }
  },
};

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD };