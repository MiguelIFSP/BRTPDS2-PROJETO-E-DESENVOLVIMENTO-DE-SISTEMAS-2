import cron from "node-cron";
import mariadb, { Connection } from "mariadb";
import { hasRecentErrorReport, recordStatusCheck } from "../services/statusCheck.service";

// A cada 6 horas (00h, 06h, 12h, 18h)
const CRON_SCHEDULE = "0 */6 * * *";
const HEALTH_CHECK_TIMEOUT_MS = 5000;
// Mesma cadência do cron — janela em que um erro reportado é considerado "recente"
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

async function checkAppDatabase() {
  let connection: Connection | undefined;

  try {
    connection = await mariadb.createConnection({
      host: process.env.APP_DATABASE_HOST,
      port: Number(process.env.APP_DATABASE_PORT),
      user: process.env.APP_DATABASE_USER,
      password: process.env.APP_DATABASE_PASSWORD,
      database: process.env.APP_DATABASE_NAME,
      connectTimeout: HEALTH_CHECK_TIMEOUT_MS,
      allowPublicKeyRetrieval: true,
    });
    await connection.query("SELECT 1");

    await recordStatusCheck("database", "OPERATIONAL");
  } catch (error) {
    await recordStatusCheck("database", "DOWN", (error as Error).message);
  } finally {
    await connection?.end().catch(() => {});
  }
}

async function checkDataApi() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${process.env.DATA_API_URL}/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      await recordStatusCheck("data-api", "DOWN", `Health check retornou status ${response.status}`);
      return;
    }

    await recordStatusCheck("data-api", "OPERATIONAL");
  } catch (error) {
    await recordStatusCheck("data-api", "DOWN", (error as Error).message);
  } finally {
    clearTimeout(timeout);
  }
}

async function checkMobileBetterMeet() {
  try {
    const since = new Date(Date.now() - CHECK_INTERVAL_MS);
    const hasRecentError = await hasRecentErrorReport("mobile-app", since);

    // Só registra OPERATIONAL se não houver ERROR/DOWN recente — evita mascarar
    // um erro que o app acabou de reportar sozinho (via POST /status).
    if (!hasRecentError) {
      await recordStatusCheck("mobile-app", "OPERATIONAL");
    }
  } catch (error) {
    console.error("Erro ao verificar status do Mobile Better Meet:", error);
  }
}

export function startHealthCheckCron() {
  cron.schedule(CRON_SCHEDULE, async () => {
    await Promise.all([checkAppDatabase(), checkDataApi(), checkMobileBetterMeet()]);
  });

  console.log(`Cron de health check agendado (${CRON_SCHEDULE})`);
}
