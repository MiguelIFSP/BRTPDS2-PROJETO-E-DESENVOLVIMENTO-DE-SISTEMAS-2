// =====================================================================
// authRoutes.ts
// Rotas PÚBLICAS de recuperação de conta (UC02).
// Não exigem autenticação: o usuário está justamente tentando
// recuperar o acesso porque NÃO consegue logar.
// =====================================================================

import { Router } from 'express';
import { authController } from '../controllers/authController.ts';

const routes = Router();

routes.post('/auth/forgot-password', authController.forgotPassword);
routes.post('/auth/reset-password', authController.resetPassword);

export default routes;