// =====================================================================
// usuarioRoutes.ts
// Rotas relacionadas a usuários.
//
// Incremento 1 (Configurações de Usuário):
//   - PATCH /usuarios/:id         → alterar dados pessoais (UC03)
//   - PATCH /usuarios/:id/tema    → alterar tema preferido  (UC04)
//   - PATCH /usuarios/:id/senha   → agora protegido por requireAuth
// =====================================================================

import { Router } from 'express';
import { usuarioController } from '../controllers/usuarioController.ts';
import {
  requireAdmin,
  requireAuth,
  requireSelf,
} from '../middlewares/authMiddleware.ts';

const routes = Router();

// Cadastro (público)
// pública porque quem se cadastra ainda não tem conta nem token.
routes.post('/usuarios', usuarioController.create);

// Relatório de usuários (somente admin)
routes.get(
  '/usuarios/relatorio',
  requireAuth,
  requireAdmin,
  usuarioController.getReport,
);

// Busca por nome ou e-mail, para adicionar membros (autenticado)
routes.get('/usuarios/busca', requireAuth, usuarioController.search);

// Troca de senha (autenticado)
routes.patch(
  '/usuarios/:id/senha',
  requireAuth,
  requireSelf,
  usuarioController.updatePassword,
);

// Alterar dados pessoais (autenticado)
routes.patch(
  '/usuarios/:id',
  requireAuth,
  requireSelf,
  usuarioController.updateProfile,
);

// Alterar tema preferido (autenticado)
routes.patch(
  '/usuarios/:id/tema',
  requireAuth,
  requireSelf,
  usuarioController.updateTheme,
);

// Promover ou rebaixar outra pessoa (somente admin; o próprio perfil não muda)
routes.patch(
  '/usuarios/:id/role',
  requireAuth,
  requireAdmin,
  usuarioController.updateRole,
);

// Comissões em que o usuário é administrador (usado pela tela de exclusão)
routes.get(
  '/usuarios/:id/comissoes-administradas',
  requireAuth,
  requireSelf,
  usuarioController.getComissoesAdministradas,
);

// Se o usuário é o único administrador da plataforma (a tela de exclusão
// pede quem assume no lugar dele)
routes.get(
  '/usuarios/:id/unico-administrador',
  requireAuth,
  requireSelf,
  usuarioController.getSituacaoAdministrador,
);

// Excluir dados pessoais (bloqueado se ainda for responsável por alguma organização)
routes.delete(
  '/usuarios/:id/dados-pessoais',
  requireAuth,
  requireSelf,
  usuarioController.deletePersonalData,
);

// Excluir dados pessoais + organizações das quais é responsável (e dados filhos)
routes.delete(
  '/usuarios/:id/dados-completos',
  requireAuth,
  requireSelf,
  usuarioController.deleteFullAccount,
);

export default routes;
