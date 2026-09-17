import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as yup from 'yup';
import prisma from './config/database.ts';
import comissaoRoutes from './routes/comissaoRoutes.ts';
import organizacaoRoutes from './routes/organizacaoRoutes.ts';
import usuarioRoutes from './routes/usuarioRoutes.ts';
import { ensureDefaultAdmin, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from './controllers/usuarioController.ts';

const app = express();
const port = Number(process.env.PORT ?? 3333);
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}
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

// isso aq tem que ser primeiro que as rotas
app.use(express.json());
app.use(cors({ origin: true }));

// ----------------------------------------
// por algum motivo as rotas tem que ser aqui
app.use('/api', comissaoRoutes);
app.use(organizacaoRoutes);
app.use(usuarioRoutes);
// ---------------------------------------

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
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

const server = app.listen(port, async () => {
  await ensureDefaultAdmin();
  console.log(`API Better Meet disponível em http://localhost:${port}`);
  console.log(`Administrador padrão: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);