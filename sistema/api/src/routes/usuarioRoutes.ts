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
import { requireAuth } from '../middlewares/auth.ts';

const routes = Router();

// Cadastro (público)
routes.post('/usuarios', usuarioController.create);

// Troca de senha (autenticado)
routes.patch('/usuarios/:id/senha', requireAuth, usuarioController.updatePassword);

// Alterar dados pessoais (autenticado)
routes.patch('/usuarios/:id', requireAuth, usuarioController.updateProfile);

// Alterar tema preferido (autenticado)
routes.patch('/usuarios/:id/tema', requireAuth, usuarioController.updateTheme);

export default routes;