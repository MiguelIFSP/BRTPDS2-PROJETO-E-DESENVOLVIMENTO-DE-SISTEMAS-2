// =====================================================================
// authController.ts
// Recuperação de conta — tela única.
// O usuário informa e-mail + nova senha + confirmação.
// O backend valida o e-mail, aplica a nova senha e responde.
//
// ATENÇÃO: não há verificação de posse do e-mail. Qualquer pessoa que
// saiba o e-mail de um usuário cadastrado pode trocar a senha dele.
// Aceitável para o escopo do Incremento 1, mas não deve ir para
// produção sem uma etapa real de verificação.
// =====================================================================

import type { Request, Response } from 'express';
import { loginSchema, recuperacaoSenhaSchema } from '../schemas/authSchema.ts';
import { authService } from '../services/authService.ts';

export const authController = {
  async login(request: Request, response: Response) {
    const { identifier, password } = await loginSchema.validate(request.body, {
      stripUnknown: true,
    });
    const session = await authService.login(identifier, password);
    response.status(200).json(session);
  },

  async forgotPassword(request: Request, response: Response) {
    const { email, newPassword } = await recuperacaoSenhaSchema.validate(
      request.body,
      { stripUnknown: true },
    );
    await authService.forgotPassword(email, newPassword);
    response.status(200).json({
      message: 'Senha redefinida com sucesso. Você já pode fazer login.',
    });
  },
};
