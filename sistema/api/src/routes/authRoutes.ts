// =====================================================================
// authRoutes.ts
// Rota PÚBLICA de recuperação de conta.
// Não exige autenticação: o usuário perdeu a senha e não consegue logar.
// =====================================================================

import { Router } from 'express';
import { authController } from '../controllers/authController.ts';

const routes = Router();

// pública: é aqui que o usuário obtém o token.
routes.post('/login', authController.login);
routes.post('/auth/forgot-password', authController.forgotPassword);

export default routes;
