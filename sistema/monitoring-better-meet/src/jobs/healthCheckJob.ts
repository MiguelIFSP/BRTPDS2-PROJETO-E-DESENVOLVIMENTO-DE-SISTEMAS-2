import cron from 'node-cron';
import mariadb, { type Connection } from 'mariadb';
import { prisma } from '../config/database.ts';
import { env } from '../config/env.ts';
import { statusCheckService } from '../services/statusCheckService.ts';

// A cada 3 horas (00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h)
const CRON_SCHEDULE = '0 */3 * * *';
const HEALTH_CHECK_TIMEOUT_MS = 5000;
// Janela de 6 h (duas execuções do cron): um erro reportado pelo app continua
// "recente" na execução seguinte, em vez de ser mascarado por um OPERATIONAL
// logo na próxima rodada.
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

// O erro bruto pode conter host, porta e usuário; a API devolve `message` no
// GET /status, então só texto fixo é gravado e o detalhe vai para o log (EX-06).
const recordDown = async (
  subSystem: string,
  message: string,
  error: unknown,
) => {
  console.error(`Falha na checagem de ${subSystem}:`, error);
  await statusCheckService.record(subSystem, 'DOWN', message);
};

const checkAppDatabase = async () => {
  let connection: Connection | undefined;

  try {
    connection = await mariadb.createConnection({
      host: env.APP_DATABASE_HOST,
      port: env.APP_DATABASE_PORT,
      user: env.APP_DATABASE_USER,
      password: env.APP_DATABASE_PASSWORD,
      database: env.APP_DATABASE_NAME,
      connectTimeout: HEALTH_CHECK_TIMEOUT_MS,
      allowPublicKeyRetrieval: true,
    });
    await connection.query('SELECT 1');

    await statusCheckService.record('database', 'OPERATIONAL');
  } catch (error) {
    await recordDown(
      'database',
      'Banco de dados da aplicação sem resposta.',
      error,
    );
  } finally {
    await connection?.end().catch(() => {});
  }
};

const checkHttpHealth = async (
  subSystem: string,
  baseUrl: string,
  downMessage: string,
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      await recordDown(
        subSystem,
        downMessage,
        new Error(`Health check retornou status ${response.status}`),
      );
      return;
    }

    await statusCheckService.record(subSystem, 'OPERATIONAL');
  } catch (error) {
    await recordDown(subSystem, downMessage, error);
  } finally {
    clearTimeout(timeout);
  }
};

const checkDataApi = () =>
  checkHttpHealth('data-api', env.DATA_API_URL, 'API de Dados sem resposta.');

const checkManagementApi = () =>
  checkHttpHealth(
    'management',
    env.MANAGEMENT_API_URL,
    'API de Gestão sem resposta.',
  );

const checkMobileBetterMeet = async () => {
  try {
    const since = new Date(Date.now() - CHECK_INTERVAL_MS);
    const hasRecentError = await statusCheckService.hasRecentErrorReport(
      'mobile-app',
      since,
    );

    // Só registra OPERATIONAL se não houver ERROR/DOWN recente: evita mascarar
    // um erro que o app acabou de reportar sozinho (POST /status/report).
    if (!hasRecentError) {
      await statusCheckService.record('mobile-app', 'OPERATIONAL');
    }
  } catch (error) {
    console.error('Erro ao verificar status do Mobile Better Meet:', error);
  }
};

// Banco da própria monitoring: já há uma conexão Prisma viva, então só testa
// nela em vez de abrir outra conexão direta como o checkAppDatabase.
const checkMonitoringDatabase = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await statusCheckService.record('monitoring-database', 'OPERATIONAL');
  } catch (error) {
    await recordDown(
      'monitoring-database',
      'Banco de dados do monitoramento sem resposta.',
      error,
    );
  }
};

// Se este job está rodando, o processo está de pé.
const checkSelf = async () => {
  try {
    await statusCheckService.record('monitoring', 'OPERATIONAL');
  } catch (error) {
    console.error('Erro ao registrar o próprio status da monitoring:', error);
  }
};

const CHECKS_BY_SUBSYSTEM = {
  database: checkAppDatabase,
  'data-api': checkDataApi,
  'mobile-app': checkMobileBetterMeet,
  'monitoring-database': checkMonitoringDatabase,
  management: checkManagementApi,
  monitoring: checkSelf,
} satisfies Record<string, () => Promise<void>>;

export const KNOWN_SUBSYSTEMS = Object.keys(CHECKS_BY_SUBSYSTEM);

const isKnownSubsystem = (
  name: string,
): name is keyof typeof CHECKS_BY_SUBSYSTEM =>
  Object.hasOwn(CHECKS_BY_SUBSYSTEM, name);

export const healthCheckJob = {
  start() {
    cron.schedule(CRON_SCHEDULE, async () => {
      await Promise.all(
        Object.values(CHECKS_BY_SUBSYSTEM).map((check) => check()),
      );
    });

    console.log(`Cron de health check agendado (${CRON_SCHEDULE})`);
  },

  // Checagem de UM subsistema agora, fora do horário do cron: evita esperar
  // até 3 h para o painel refletir uma ação de start/stop/restart.
  async runSingle(subSystem: string) {
    if (!isKnownSubsystem(subSystem)) return false;

    await CHECKS_BY_SUBSYSTEM[subSystem]();
    return true;
  },
};
