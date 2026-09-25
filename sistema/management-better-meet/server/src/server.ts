import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import subsystemRoutes from './routes/subsystem.routes';
import { reportStatus } from './services/monitoringReporter';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido no .env');
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(subsystemRoutes);

// Painel admin: build estático do management-better-meet/web (rodar
// "npx expo export -p web" lá antes) — sobe em /admin, ex.: /admin, /admin/login.
app.use('/admin', express.static(path.join(__dirname, '../../web/dist'), { extensions: ['html'] }));

const PORT = process.env.PORT || 3335;
const server = app.listen(PORT, async () => {
  console.log(`Management API rodando na porta ${PORT}`);
  await reportStatus('OPERATIONAL', 'Serviço iniciado');
});

// Reporta a própria parada (comando do PM2 — inclusive o self-restart via
// /subsystems/management/:action) antes de sair, pra não esperar o cron.
const shutdown = async () => {
  await reportStatus('MAINTENANCE', 'Parada solicitada');
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
