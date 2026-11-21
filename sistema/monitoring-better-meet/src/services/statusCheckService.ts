import { StatusType } from '@prisma/client';
import { prisma } from '../config/database.ts';
import { AppError } from '../errors/AppError.ts';
import type { AuthenticatedUser } from '../middlewares/authMiddleware.ts';
import type {
  StatusRelatavel,
  SubsistemaRelatavel,
} from '../schemas/statusSchema.ts';
import { addDays, localDateKey, startOfLocalDay } from '../utils/timeZone.ts';

type ReportInput = {
  subSystem: SubsistemaRelatavel;
  status: StatusRelatavel;
  message: string;
  isBlocking?: boolean | undefined;
};

const STATUS_SEVERITY = {
  DOWN: 4,
  ERROR: 3,
  MAINTENANCE: 2,
  UNKNOWN: 1,
  OPERATIONAL: 0,
} satisfies Record<StatusType, number>;

const getWorstStatus = (checks: { status: StatusType }[]): StatusType => {
  const [first, ...others] = checks;
  if (!first) return StatusType.UNKNOWN;

  return others.reduce(
    (worst, current) =>
      STATUS_SEVERITY[current.status] > STATUS_SEVERITY[worst.status]
        ? current
        : worst,
    first,
  ).status;
};

const calculateUptime = (operational: number, total: number) =>
  total > 0 ? Math.round((operational / total) * 10000) / 100 : null;

// Texto vem de cliente não confiável e é devolvido pelo GET /status: sem
// quebras de linha ou caracteres de controle, para não forjar linhas de log
// nem bagunçar a tela de quem lê.
const sanitizeMessage = (message: string) =>
  Array.from(message, (char) => {
    const code = char.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : char;
  })
    .join('')
    .trim()
    .slice(0, 500);

export const statusCheckService = {
  async record(
    subSystemName: string,
    status: StatusType,
    message?: string,
    isBlocking: boolean = false,
  ) {
    // upsert evita seed manual: o sub-sistema nasce na primeira vez que reporta
    const subSystem = await prisma.subSystem.upsert({
      where: { name: subSystemName },
      update: {},
      create: { name: subSystemName },
    });

    return prisma.statusCheck.create({
      data: {
        subSystemId: subSystem.id,
        status,
        message: message ?? null,
        isBlocking,
      },
    });
  },

  // Relato de usuário autenticado (contrato C3). O painel de gestão é
  // restrito ao ADMIN porque o estado dele aparece para todos os gestores.
  async report(user: AuthenticatedUser, input: ReportInput) {
    if (input.subSystem === 'management' && user.role !== 'ADMIN') {
      throw new AppError(
        403,
        'Somente administradores reportam erros do painel.',
      );
    }

    return statusCheckService.record(
      input.subSystem,
      input.status,
      sanitizeMessage(input.message),
      input.isBlocking ?? false,
    );
  },

  // O app reporta erro ativamente e não tem endpoint para o cron "bater": o
  // job só registra OPERATIONAL se não houver ERROR/DOWN recente.
  async hasRecentErrorReport(subSystemName: string, since: Date) {
    const subSystem = await prisma.subSystem.findUnique({
      where: { name: subSystemName },
    });
    if (!subSystem) return false;

    const recentError = await prisma.statusCheck.findFirst({
      where: {
        subSystemId: subSystem.id,
        status: { in: ['ERROR', 'DOWN', 'MAINTENANCE'] },
        checkedAt: { gte: since },
      },
    });

    return recentError !== null;
  },

  async getLatest() {
    const subSystems = await prisma.subSystem.findMany({
      include: { checks: { orderBy: { checkedAt: 'desc' }, take: 1 } },
    });

    return subSystems.map((sub) => ({
      id: sub.id,
      subSystem: sub.name,
      status: sub.checks[0]?.status ?? StatusType.UNKNOWN,
      message: sub.checks[0]?.message ?? null,
      checkedAt: sub.checks[0]?.checkedAt ?? null,
    }));
  },

  // dateKey: "AAAA-MM-DD" no fuso de Brasília (ver utils/timeZone.ts).
  async getDaily(dateKey: string) {
    const startOfDay = startOfLocalDay(dateKey);
    const startOfNextDay = startOfLocalDay(addDays(dateKey, 1));

    const subSystems = await prisma.subSystem.findMany({
      include: {
        checks: {
          where: { checkedAt: { gte: startOfDay, lt: startOfNextDay } },
          orderBy: { checkedAt: 'asc' },
        },
      },
    });

    return subSystems.map((sub) => {
      const checks = sub.checks;
      const total = checks.length;
      const operational = checks.filter(
        (check) => check.status === 'OPERATIONAL',
      ).length;

      return {
        subSystem: sub.name,
        date: dateKey,
        totalChecks: total,
        uptimePercentage: calculateUptime(operational, total),
        lastStatus: checks[total - 1]?.status ?? StatusType.UNKNOWN,
        checks: checks.map((check) => ({
          status: check.status,
          message: check.message,
          checkedAt: check.checkedAt,
        })),
      };
    });
  },

  async getHistory(subSystemId: number, days: number) {
    const subSystem = await prisma.subSystem.findUnique({
      where: { id: subSystemId },
    });
    if (!subSystem) {
      throw new AppError(404, 'Sub-sistema não encontrado.');
    }

    // Dias no fuso de Brasília, não em UTC: um check às 22h daqui já é o dia
    // seguinte em UTC e cairia na barra errada (ver utils/timeZone.ts). A
    // chave do dia e os limites da consulta usam o mesmo fuso.
    const todayKey = localDateKey(new Date());
    const firstDayKey = addDays(todayKey, -(days - 1));

    const checks = await prisma.statusCheck.findMany({
      where: {
        subSystemId,
        checkedAt: {
          gte: startOfLocalDay(firstDayKey),
          lt: startOfLocalDay(addDays(todayKey, 1)),
        },
      },
      orderBy: { checkedAt: 'asc' },
    });

    // Esqueleto com todos os dias do período, mesmo os sem check
    const dayMap = new Map<string, typeof checks>();
    for (let i = 0; i < days; i++) {
      dayMap.set(addDays(firstDayKey, i), []);
    }

    for (const check of checks) {
      dayMap.get(localDateKey(check.checkedAt))?.push(check);
    }

    const history = Array.from(dayMap.entries()).map(([date, dayChecks]) => {
      const total = dayChecks.length;
      const operational = dayChecks.filter(
        (check) => check.status === 'OPERATIONAL',
      ).length;

      return {
        date,
        totalChecks: total,
        uptimePercentage: calculateUptime(operational, total),
        lastStatus: dayChecks[total - 1]?.status ?? StatusType.UNKNOWN,
        worstStatus: getWorstStatus(dayChecks),
      };
    });

    return { subSystemId, subSystem: subSystem.name, days, history };
  },
};
