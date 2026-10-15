import jwt from 'jsonwebtoken';
import prisma from '../config/database.ts';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';
import { hashPassword, verifyPassword } from '../utils/passwordHash.ts';
import { userPublicSelect } from './usuarioService.ts';

// O app e a monitoring-better-meet validam este token com o mesmo JWT_SECRET.
const TOKEN_EXPIRES_IN = '7d';

export const authService = {
  // identifier: e-mail ou nome do usuário, já em minúsculas.
  async login(identifier: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { name: identifier }] },
      select: { ...userPublicSelect, password: true },
    });

    if (!user || !verifyPassword(password, user.password)) {
      throw new AppError(401, 'Usuário/e-mail ou senha inválidos.');
    }

    const { password: _password, ...publicUser } = user;
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN },
    );

    return { ...publicUser, token };
  },

  // ATENÇÃO: não há verificação de posse do e-mail (ver authController.ts).
  async forgotPassword(email: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      throw new AppError(404, 'E-mail não cadastrado.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword) },
    });
  },
};
