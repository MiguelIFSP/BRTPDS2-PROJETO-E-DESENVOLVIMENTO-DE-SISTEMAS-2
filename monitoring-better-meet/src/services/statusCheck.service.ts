import { prisma } from "../config/database";
import { StatusType } from "@prisma/client";

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

export async function getLatestStatus() {
  const subSystems = await prisma.subSystem.findMany({
    include: { checks: { orderBy: { checkedAt: "desc" }, take: 1 } },
  });

  return subSystems.map((sub) => ({
    subSystem: sub.name,
    status: sub.checks[0]?.status ?? "UNKNOWN",
    message: sub.checks[0]?.message ?? null,
    checkedAt: sub.checks[0]?.checkedAt ?? null,
  }));
}

export async function getDailyStatus(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const subSystems = await prisma.subSystem.findMany({
    include: {
      checks: {
        where: { checkedAt: { gte: startOfDay, lte: endOfDay } },
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
      date: startOfDay.toISOString().split("T")[0],
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

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const checks = await prisma.statusCheck.findMany({
    where: { subSystemId, checkedAt: { gte: startDate, lte: endDate } },
    orderBy: { checkedAt: "asc" },
  });

  // Monta um "esqueleto" com todos os dias do período, mesmo os sem check
  const dayMap = new Map<string, typeof checks>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dayMap.set(d.toISOString().split("T")[0]!, []);
  }

  for (const check of checks) {
    const key = check.checkedAt.toISOString().split("T")[0]!;
    dayMap.get(key)?.push(check);
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