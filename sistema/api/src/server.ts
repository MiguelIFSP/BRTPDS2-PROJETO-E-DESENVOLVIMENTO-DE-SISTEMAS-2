// =====================================================================
// server.ts
// Ponto de entrada da API BetterMeet.
//
// Incremento 1 – Configurações de Usuário:
//   - Importa e registra authRoutes (rotas públicas de recuperação)
//   - Retorna themePreference no login para o app aplicar o tema
// =====================================================================

import { readFileSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import prisma from './config/database.ts';
import { env } from './config/env.ts';
import { handleError } from './middlewares/errorMiddleware.ts';

// Rotas existentes
import comissaoRoutes from './routes/comissaoRoutes.ts';
import organizacaoRoutes from './routes/organizacaoRoutes.ts';
import usuarioRoutes from './routes/usuarioRoutes.ts';

// NOVO: rotas de recuperação de conta (UC02)
import authRoutes from './routes/authRoutes.ts';

import { authController } from './controllers/authController.ts';

import { monitoringService } from './services/monitoringService.ts';
import { usuarioService } from './services/usuarioService.ts';

const openApiDocument: Record<string, unknown> = YAML.parse(
  readFileSync(
    path.join(import.meta.dirname, '..', 'docs', 'openapi.yaml'),
    'utf8',
  ),
);

const app = express();

// Middlewares globais
app.use(express.json());
app.use(cors({ origin: true }));

// Registro das rotas
const apiRouter = Router();
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
// NOVO: rotas públicas de recuperação
apiRouter.use(authRoutes);
apiRouter.use(usuarioRoutes);
apiRouter.use(organizacaoRoutes);
apiRouter.use(comissaoRoutes);

app.use('/api', apiRouter);

// EXCEÇÃO TEMPORÁRIA ao padrão /api: o painel da management-better-meet/web
// ainda faz login em POST /login, sem o prefixo. Sai quando a management for
// refatorada para chamar /api/login.
app.post('/login', authController.login);

// Healthcheck
// Fora do /api de propósito: usado pela monitoring e pelo start-all.ps1.
app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

// sem isso, rota inexistente responderia com a página HTML padrão do Express.
app.use((_request, response) => {
  response.status(404).json({ error: 'Rota não encontrada.' });
});

app.use(handleError);

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
const server = app.listen(env.PORT, async () => {
  await usuarioService.ensureDefaultAdmin();
  console.log(`API Better Meet disponível em http://localhost:${env.PORT}/api`);
  await monitoringService.reportStatus('OPERATIONAL', 'Serviço iniciado');
});

// Reporta a própria parada antes de sair, pra monitoring não esperar o cron.
const shutdown = async () => {
  await monitoringService.reportStatus('MAINTENANCE', 'Parada solicitada');
  server.close();
  await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
