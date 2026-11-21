// =====================================================================
// server.ts
// Ponto de entrada da API BetterMeet.
//
// Incremento 1 – Configurações de Usuário:
//   - Importa e registra authRoutes (rotas públicas de recuperação)
//   - Retorna themePreference no login para o app aplicar o tema
// =====================================================================

import prisma from './config/database.ts';
import { env } from './config/env.ts';
import { criarApp } from './app.ts';
import { lembreteJob } from './jobs/lembreteJob.ts';
import { monitoringService } from './services/monitoringService.ts';
import { usuarioService } from './services/usuarioService.ts';

const app = criarApp();

// ---------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------
const server = app.listen(env.PORT, async () => {
  await usuarioService.ensureDefaultAdmin();
  console.log(`API Better Meet disponível em http://localhost:${env.PORT}/api`);
  lembreteJob.start();
  await monitoringService.reportStatus('OPERATIONAL', 'Serviço iniciado');
});

// Reporta a própria parada antes de sair, pra monitoring não esperar o cron.
const shutdown = async () => {
  lembreteJob.stop();
  await monitoringService.reportStatus('MAINTENANCE', 'Parada solicitada');
  server.close();
  await prisma.$disconnect();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
