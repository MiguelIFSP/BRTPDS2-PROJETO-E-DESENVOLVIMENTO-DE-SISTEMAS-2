// =====================================================================
// usuarioController.ts
// Contém os controllers de:
//   - create         (já existia) - cadastro de usuário
//   - updatePassword (já existia) - troca de senha  (UC01)
//   - updateProfile  (NOVO)       - alteração de dados pessoais (UC03)
//   - updateTheme    (NOVO)       - alteração do tema preferido  (UC04)
// =====================================================================

import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  buscaUsuarioSchema,
  cadastroUsuarioSchema,
  exclusaoContaSchema,
  perfilSchema,
  roleSchema,
  temaSchema,
  trocaSenhaSchema,
} from '../schemas/usuarioSchema.ts';
import { usuarioService } from '../services/usuarioService.ts';
import { parseId } from '../utils/parseId.ts';

// =====================================================================
// CONTROLLER
// =====================================================================
// As rotas /usuarios/:id/... passam por requireSelf, então o :id já foi
// validado e é o próprio usuário do token.
export const usuarioController = {
  // -------------------------------------------------------------------
  // create — Cadastro de novo usuário
  // -------------------------------------------------------------------
  async create(request: Request, response: Response) {
    const { nome, email, password } = await cadastroUsuarioSchema.validate(
      request.body,
      { stripUnknown: true },
    );
    const user = await usuarioService.create({ nome, email, password });
    response.status(201).json(user);
  },

  // -------------------------------------------------------------------
  // updatePassword — UC01 (Troca de Senha)
  // -------------------------------------------------------------------
  async updatePassword(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const { currentPassword, newPassword } = await trocaSenhaSchema.validate(
      request.body,
      { stripUnknown: true },
    );
    await usuarioService.updatePassword(userId, currentPassword, newPassword);
    response.status(200).json({ message: 'Senha alterada com sucesso.' });
  },

  // -------------------------------------------------------------------
  // updateProfile — UC03 (Alterar Dados Pessoais)
  // -------------------------------------------------------------------
  async updateProfile(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const perfil = await perfilSchema.validate(request.body, {
      stripUnknown: true,
    });
    const user = await usuarioService.updateProfile(userId, perfil);
    response.status(200).json(user);
  },

  // -------------------------------------------------------------------
  // updateTheme — UC04 (Tema Preferido)
  // -------------------------------------------------------------------
  async updateTheme(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const { theme } = await temaSchema.validate(request.body, {
      stripUnknown: true,
    });
    const user = await usuarioService.updateTheme(userId, theme);
    response.status(200).json(user);
  },

  async updateRole(request: Request, response: Response) {
    const { id: actorId } = (request as AuthenticatedRequest).user;
    const userId = parseId(request.params.id, 'do usuário');
    const { role } = await roleSchema.validate(request.body, {
      stripUnknown: true,
    });
    const user = await usuarioService.updateRole(actorId, userId, role);
    response.status(200).json(user);
  },

  async getComissoesAdministradas(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const comissoes = await usuarioService.getComissoesAdministradas(userId);
    response.status(200).json(comissoes);
  },

  async getSituacaoAdministrador(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const unicoAdministrador =
      await usuarioService.isUnicoAdministrador(userId);
    response.status(200).json({ unicoAdministrador });
  },

  async deletePersonalData(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const { sucessores, sucessoresComissao, novoAdministradorId } =
      await exclusaoContaSchema.validate(request.body ?? {}, {
        stripUnknown: true,
      });
    await usuarioService.deletePersonalData(
      userId,
      sucessores,
      sucessoresComissao,
      novoAdministradorId,
    );
    response
      .status(200)
      .json({ message: 'Seus dados pessoais foram excluídos com sucesso.' });
  },

  async deleteFullAccount(request: Request, response: Response) {
    const userId = parseId(request.params.id, 'do usuário');
    const { sucessoresComissao, novoAdministradorId } =
      await exclusaoContaSchema.validate(request.body ?? {}, {
        stripUnknown: true,
      });
    await usuarioService.deleteFullAccount(
      userId,
      sucessoresComissao,
      novoAdministradorId,
    );
    response.status(200).json({
      message: 'Sua conta e suas organizações foram excluídas com sucesso.',
    });
  },

  async search(request: Request, response: Response) {
    const { q, organizacaoId } = await buscaUsuarioSchema.validate(
      request.query,
      { stripUnknown: true },
    );
    const usuarios = await usuarioService.search(q, organizacaoId);
    response.status(200).json(usuarios);
  },

  async getReport(_request: Request, response: Response) {
    const report = await usuarioService.getReport();
    response.status(200).json(report);
  },
};
