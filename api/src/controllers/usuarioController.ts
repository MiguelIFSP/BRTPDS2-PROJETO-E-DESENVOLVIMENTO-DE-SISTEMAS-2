import crypto from 'crypto';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import prisma from '../config/database.ts';

const DEFAULT_ADMIN_EMAIL = 'admin@bettermeet.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update(DEFAULT_ADMIN_PASSWORD).digest('hex');

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

const passwordUpdateSchema = yup.object({
  currentPassword: yup
    .string()
    .required('A senha atual é obrigatória.'),
  newPassword: yup
    .string()
    .required('A nova senha é obrigatória.')
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .max(72, 'A nova senha deve ter no máximo 72 caracteres.')
    .matches(/[A-Z]/, 'A nova senha deve conter pelo menos uma letra maiúscula.')
    .matches(/[a-z]/, 'A nova senha deve conter pelo menos uma letra minúscula.')
    .matches(/[0-9]/, 'A nova senha deve conter pelo menos um número.'),
});

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

export const usuarioController = {
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
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
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
};

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD };