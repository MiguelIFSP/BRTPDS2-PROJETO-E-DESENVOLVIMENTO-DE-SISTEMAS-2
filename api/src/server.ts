import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as yup from 'yup';

const app = express();
const port = Number(process.env.PORT ?? 3333);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}
const DEFAULT_ADMIN_EMAIL = 'admin@bettermeet.com';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';
const DEFAULT_ADMIN_PASSWORD_HASH = crypto.createHash('sha256').update(DEFAULT_ADMIN_PASSWORD).digest('hex');
const databaseUrl = new URL(process.env.DATABASE_URL ?? 'mysql://user_node:node_password@localhost:3306/bettermeet');
const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: Number(databaseUrl.port || 3306),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });
const organizationSchema = yup.object({
  nome: yup.string().trim().required('O nome da organização é obrigatório.').max(80, 'O nome da organização deve ter no máximo 80 caracteres.'),
});

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

const loginSchema = yup.object({
  identifier: yup
    .string()
    .trim()
    .required('Informe seu usuário ou e-mail.')
    .min(2, 'Informe seu usuário ou e-mail válido.'),
  email: yup
    .string()
    .trim()
    .optional(),
  user: yup
    .string()
    .trim()
    .optional(),
  password: yup
    .string()
    .required('A senha é obrigatória.'),
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

app.use(express.json());
app.use(cors({ origin: true }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/organizacoes', async (request, response) => {
  try {
    const { nome } = await organizationSchema.validate(request.body, { stripUnknown: true });
    const organizacao = await prisma.organizacao.create({
      data: {
        nome,
        status: 'PENDENTE',
      },
    });

    response.status(201).json(organizacao);
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
      return;
    }

    console.error('Erro ao criar organização:', error);
    response.status(500).json({ error: 'Não foi possível criar a organização.' });
  }
});

app.post('/login', async (request, response) => {
  try {
    const { identifier, email, user, password } = await loginSchema.validate(request.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    const normalizedIdentifier = (identifier ?? email ?? user ?? '').trim().toLowerCase();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
    const userRecord = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: normalizedIdentifier } },
          { name: { equals: normalizedIdentifier } },
        ],
      },
    });

    if (!userRecord || userRecord.password !== passwordHash) {
      response.status(401).json({ error: 'Usuário/e-mail ou senha inválidos.' });
      return;
    }

    const token = jwt.sign(
      { sub: userRecord.id, email: userRecord.email, role: userRecord.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.status(200).json({
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
      token,
    });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      response.status(400).json({ error: error.errors[0] ?? 'Dados inválidos.' });
      return;
    }

    console.error('Erro ao autenticar usuário:', error);
    response.status(500).json({ error: 'Não foi possível autenticar o usuário.' });
  }
});

const ensureDefaultAdmin = async () => {
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

app.post('/usuarios', async (request, response) => {
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
});

app.patch('/usuarios/:id/senha', async (request, response) => {
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
});

const server = app.listen(port, async () => {
  await ensureDefaultAdmin();
  console.log(`API Better Meet disponível em http://localhost:${port}`);
  console.log(`Administrador padrão: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);