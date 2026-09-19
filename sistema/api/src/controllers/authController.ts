// =====================================================================
// authController.ts
// Fluxo de recuperação de conta (UC02).
//
// Separado do usuarioController porque:
//   - usuarioController = operações sobre conta AUTENTICADA
//   - authController    = operações PÚBLICAS (usuário perdeu a senha)
// =====================================================================

import crypto from 'crypto';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import prisma from '../config/database.ts';

// Token válido por 1 hora — equilibra segurança (janela curta de ataque)
// e usabilidade (tempo do usuário ver o e-mail e clicar no link).
const TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Informe seu e-mail.')
    .email('Informe um e-mail válido.'),
});

const resetPasswordSchema = yup.object({
  token: yup.string().trim().required('Token é obrigatório.'),
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
  // -------------------------------------------------------------------
  // forgotPassword — inicia o fluxo de recuperação
  // -------------------------------------------------------------------
  // Anti-enumeração: SEMPRE retorna a MESMA mensagem, exista ou não o e-mail.
  // -------------------------------------------------------------------
  async forgotPassword(request: Request, response: Response) {
    try {
      const { email } = await forgotPasswordSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

        await prisma.passwordResetToken.create({
          data: { userId: user.id, token, expiresAt },
        });

        // Em produção: enviaria por e-mail. Em dev: loga no console.
        console.log('\n========================================');
        console.log(`📧 [DEV] Recuperação para: ${user.email}`);
        console.log(`🔗 Link: bettermeet://reset-password?token=${token}`);
        console.log(`⏱️  Expira em: ${expiresAt.toISOString()}`);
        console.log('========================================\n');
      }

      response.status(200).json({
        message:
          'Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro em forgotPassword:', error);
      response.status(500).json({ error: 'Não foi possível processar a solicitação.' });
    }
  },

  // -------------------------------------------------------------------
  // resetPassword — consome o token e redefine a senha
  // -------------------------------------------------------------------
  async resetPassword(request: Request, response: Response) {
    try {
      const { token, newPassword } = await resetPasswordSchema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (!tokenRecord) {
        response.status(400).json({ error: 'Token inválido.' });
        return;
      }

      if (tokenRecord.usedAt !== null) {
        response.status(400).json({ error: 'Este token já foi utilizado.' });
        return;
      }

      if (tokenRecord.expiresAt < new Date()) {
        response.status(400).json({ error: 'Token expirado. Solicite um novo.' });
        return;
      }

      const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

      await prisma.$transaction([
        prisma.user.update({
          where: { id: tokenRecord.userId },
          data: { password: newPasswordHash },
        }),
        prisma.passwordResetToken.update({
          where: { id: tokenRecord.id },
          data: { usedAt: new Date() },
        }),
      ]);

      response.status(200).json({
        message: 'Senha redefinida com sucesso. Você já pode fazer login.',
      });
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
        return;
      }
      console.error('Erro em resetPassword:', error);
      response.status(500).json({ error: 'Não foi possível redefinir a senha.' });
    }
  },
};