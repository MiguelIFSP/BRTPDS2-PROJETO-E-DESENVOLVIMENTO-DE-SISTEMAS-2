import cron from "node-cron";
import mariadb, { Connection } from "mariadb";
import { recordStatusCheck } from "../services/statusCheck.service";

// A cada 6 horas (00h, 06h, 12h, 18h)
const CRON_SCHEDULE = "0 */6 * * *";
const HEALTH_CHECK_TIMEOUT_MS = 5000;

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

export function startHealthCheckCron() {
  cron.schedule(CRON_SCHEDULE, async () => {
    await Promise.all([checkAppDatabase(), checkDataApi()]);
  });

  console.log(`Cron de health check agendado (${CRON_SCHEDULE})`);
}
