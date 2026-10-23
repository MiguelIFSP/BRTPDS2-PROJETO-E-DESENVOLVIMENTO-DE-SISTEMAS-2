import { prisma } from "../config/database";
import { StatusType } from "@prisma/client";
import { addDays, localDateKey, startOfLocalDay } from "../utils/timeZone";

export async function recordStatusCheck(
  subSystemName: string,
  status: StatusType,
  message?: string,
  isBlocking: boolean = false
) {
  // upsert evita precisar de seed manual: cria o sub-sistema na primeira vez que ele reportar
  const subSystem = await prisma.subSystem.upsert({
    where: { name: subSystemName },
    update: {},
    create: { name: subSystemName },
  });

  return prisma.statusCheck.create({
    data: { subSystemId: subSystem.id, status, message, isBlocking },
  });
}

// Usado pelo cron do mobile-app: só registra OPERATIONAL se não houver ERROR/DOWN recente
// (o app reporta erro ativamente via POST /status, não tem endpoint fixo pra "bater")
export async function hasRecentErrorReport(subSystemName: string, since: Date): Promise<boolean> {
  const subSystem = await prisma.subSystem.findUnique({ where: { name: subSystemName } });
  if (!subSystem) return false;

  const recentError = await prisma.statusCheck.findFirst({
    where: {
      subSystemId: subSystem.id,
      status: { in: ["ERROR", "DOWN", "MAINTENANCE"] },
      checkedAt: { gte: since },
    },
  });

  return recentError !== null;
}

export async function getLatestStatus() {
  const subSystems = await prisma.subSystem.findMany({
    include: { checks: { orderBy: { checkedAt: "desc" }, take: 1 } },
  });

  return subSystems.map((sub) => ({
    id: sub.id,
    subSystem: sub.name,
    status: sub.checks[0]?.status ?? "UNKNOWN",
    message: sub.checks[0]?.message ?? null,
    checkedAt: sub.checks[0]?.checkedAt ?? null,
  }));
}

// dateKey: "AAAA-MM-DD" no fuso de Brasília (ver utils/timeZone.ts).
export async function getDailyStatus(dateKey: string) {
  const startOfDay = startOfLocalDay(dateKey);
  const startOfNextDay = startOfLocalDay(addDays(dateKey, 1));

  const subSystems = await prisma.subSystem.findMany({
    include: {
      checks: {
        where: { checkedAt: { gte: startOfDay, lt: startOfNextDay } },
        orderBy: { checkedAt: "asc" },
      },
    },
  });

  return subSystems.map((sub) => {
    const checks = sub.checks;
    const total = checks.length;
    const operational = checks.filter((c) => c.status === "OPERATIONAL").length;

    return {
      subSystem: sub.name,
      date: dateKey,
      totalChecks: total,
      uptimePercentage: total > 0 ? Math.round((operational / total) * 10000) / 100 : null,
      lastStatus: checks[total - 1]?.status ?? "UNKNOWN",
      checks: checks.map((c) => ({ status: c.status, message: c.message, checkedAt: c.checkedAt })),
    };
  });
}

const STATUS_SEVERITY: Record<string, number> = {
  DOWN: 4,
  ERROR: 3,
  MAINTENANCE: 2,
  UNKNOWN: 1,
  OPERATIONAL: 0,
};

function getWorstStatus(checks: { status: string }[]): string {
  if (checks.length === 0) return "UNKNOWN";

  return checks.reduce((worst, current) =>
    STATUS_SEVERITY[current.status]! > STATUS_SEVERITY[worst]! ? current.status : worst
  , checks[0]!.status);
}

export async function getStatusHistoryBySubSystem(subSystemId: number, days: number) {
  const subSystem = await prisma.subSystem.findUnique({ where: { id: subSystemId } });
  if (!subSystem) return null;

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
    orderBy: { checkedAt: "asc" },
  });

  // Monta um "esqueleto" com todos os dias do período, mesmo os sem check
  const dayMap = new Map<string, typeof checks>();
  for (let i = 0; i < days; i++) {
    dayMap.set(addDays(firstDayKey, i), []);
  }

  for (const check of checks) {
    dayMap.get(localDateKey(check.checkedAt))?.push(check);
  }

  const history = Array.from(dayMap.entries()).map(([date, dayChecks]) => {
    const total = dayChecks.length;
    const operational = dayChecks.filter((c) => c.status === "OPERATIONAL").length;

    return {
      date,
      totalChecks: total,
      uptimePercentage: total > 0 ? Math.round((operational / total) * 10000) / 100 : null,
      lastStatus: dayChecks[total - 1]?.status ?? "UNKNOWN",
      worstStatus: getWorstStatus(dayChecks),
    };
  });

  return { subSystemId, subSystem: subSystem.name, days, history };
}