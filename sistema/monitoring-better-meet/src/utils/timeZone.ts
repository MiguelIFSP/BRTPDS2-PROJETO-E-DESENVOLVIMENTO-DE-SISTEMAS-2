// O banco grava os horários em UTC (padrão do Prisma) — certo, e não deve
// mudar. O que muda é o "dia": um check às 22h de Brasília já é o dia
// seguinte em UTC. Agrupar por dia, então, precisa usar o fuso do negócio,
// independente do fuso da máquina onde a monitoring roda.
export const APP_TIME_ZONE = "America/Sao_Paulo";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// Data/hora de parede no fuso do negócio, como se fosse UTC (só para contas).
function wallClockAsUtc(date: Date): number {
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
}

// "AAAA-MM-DD" do dia em que esse instante cai no fuso do negócio.
export function localDateKey(date: Date): string {
  return new Date(wallClockAsUtc(date)).toISOString().slice(0, 10);
}

// Soma dias a uma chave "AAAA-MM-DD" (aritmética de calendário, sem fuso).
export function addDays(dateKey: string, days: number): string {
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

// Instante (UTC) em que começa o dia "AAAA-MM-DD" no fuso do negócio.
export function startOfLocalDay(dateKey: string): Date {
  const midnightAsUtc = Date.parse(`${dateKey}T00:00:00Z`);
  const offset = wallClockAsUtc(new Date(midnightAsUtc)) - midnightAsUtc;
  return new Date(midnightAsUtc - offset);
}

// true se for uma data "AAAA-MM-DD" que existe no calendário.
export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed) && new Date(parsed).toISOString().startsWith(value);
}
