import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import statusRoutes from "./routes/status.routes";
import { startHealthCheckCron } from "./jobs/healthCheck.cron";
import { recordStatusCheck } from "./services/statusCheck.service";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/monitoring-better-meet", statusRoutes);

const PORT = process.env.PORT || 3334;
const server = app.listen(PORT, async () => {
  console.log(`Server rodando na porta ${PORT}`);
  await recordStatusCheck("monitoring", "OPERATIONAL", "Serviço iniciado");
});

startHealthCheckCron();

// Reporta a própria parada (comando do PM2) antes de sair, pra não esperar o
// cron das próximas 6h pra refletir isso no painel.
const shutdown = async () => {
  await recordStatusCheck("monitoring", "MAINTENANCE", "Parada solicitada");
  server.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);