import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { monitoringReporterService } from './services/monitoringReporterService.ts';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`Management API rodando na porta ${env.PORT}`);
  await monitoringReporterService.reportStatus(
    'OPERATIONAL',
    'Serviço iniciado',
  );
});

// Reporta a própria parada (comando do PM2 — inclusive o self-restart via
// /subsystems/management/:action) antes de sair, pra não esperar o cron.
const shutdown = async () => {
  await monitoringReporterService.reportStatus(
    'MAINTENANCE',
    'Parada solicitada',
  );
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
