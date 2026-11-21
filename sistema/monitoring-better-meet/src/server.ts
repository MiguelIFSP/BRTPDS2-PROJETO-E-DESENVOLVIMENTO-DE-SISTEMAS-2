import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { healthCheckJob } from './jobs/healthCheckJob.ts';
import { statusCheckService } from './services/statusCheckService.ts';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`Servidor rodando na porta ${env.PORT}`);
  await statusCheckService.record(
    'monitoring',
    'OPERATIONAL',
    'Serviço iniciado',
  );
});

healthCheckJob.start();

// Reporta a própria parada (comando do PM2) antes de sair, para não esperar o
// cron seguinte refletir isso no painel.
const shutdown = async () => {
  await statusCheckService.record(
    'monitoring',
    'MAINTENANCE',
    'Parada solicitada',
  );
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
