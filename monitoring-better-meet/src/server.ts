import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import statusRoutes from "./routes/status.routes";
import { startHealthCheckCron } from "./jobs/healthCheck.cron";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/monitoring-better-meet", statusRoutes);

const PORT = process.env.PORT || 3334;
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));

startHealthCheckCron();