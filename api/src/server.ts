import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as yup from 'yup';

const app = express();
const port = Number(process.env.PORT ?? 3333);
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

const server = app.listen(port, () => {
  console.log(`API Better Meet disponível em http://localhost:${port}`);
});

const shutdown = async () => {
  server.close();
  await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);