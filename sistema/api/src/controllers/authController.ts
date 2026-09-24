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

import crypto from 'crypto';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import prisma from '../config/database.ts';

const sha256 = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex');

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
  newPassword: yup
    .string()
    .required('A nova senha é obrigatória.')
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A nova senha deve ter no máximo 72 caracteres.')
    .matches(/[A-Z]/, 'A nova senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[a-z]/, 'A nova senha deve conter pelo menos uma letra minúscula.')
    .matches(/[0-9]/, 'A nova senha deve conter pelo menos um número.'),
});

export const authController = {
  async forgotPassword(request: Request, response: Response) {
    try {
      const { email, newPassword } = await forgotPasswordSchema.validate(
        request.body,
        { abortEarly: false, stripUnknown: true }
      );

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        response.status(404).json({ error: 'E-mail não cadastrado.' });
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { password: sha256(newPassword) },
      });

      response
        .status(200)
        .json({ message: 'Senha redefinida com sucesso. Você já pode fazer login.' });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response
          .status(400)
          .json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro em forgotPassword:', error);
      response
        .status(500)
        .json({ error: 'Não foi possível redefinir a senha.' });
    }
  },
};