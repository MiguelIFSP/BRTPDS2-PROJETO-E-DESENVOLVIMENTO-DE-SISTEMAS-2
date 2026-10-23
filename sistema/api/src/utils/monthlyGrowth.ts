export const MESES_CRESCIMENTO = 12;

// O banco grava em UTC (padrão do Prisma), mas o mês de um cadastro é o de
// Brasília: às 22h do dia 31 aqui já é o dia 1º do mês seguinte em UTC.
export const APP_TIME_ZONE = 'America/Sao_Paulo';

const yearMonthFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
});

// chave YYYY-MM no fuso de Brasília, usada so pra bucket — a exibicao (nome do mes) fica por conta do front.
export const yearMonthKey = (date: Date) => {
  const parts = Object.fromEntries(
    yearMonthFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}`;
};

// monta os ultimos N meses (mais antigo primeiro), cada um comecando com contagem 0.
export const lastMonthKeys = (months: number) => {
  const [year, month] = yearMonthKey(new Date()).split('-').map(Number);
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    // só aritmética de calendário: o dia 1 em UTC já é o mês certo.
    const date = new Date(Date.UTC(year!, month! - 1 - i, 1));
    keys.push(date.toISOString().slice(0, 7));
  }
  return keys;
};

/**
 * Conta quantas datas caem em cada um dos últimos `months` meses. Datas mais
 * antigas que a janela são ignoradas; meses sem registro aparecem com 0.
 */
export const countByMonth = (dates: Date[], months = MESES_CRESCIMENTO) => {
  const counts = new Map(lastMonthKeys(months).map((key) => [key, 0]));
  for (const date of dates) {
    const key = yearMonthKey(date);
    const current = counts.get(key);
    if (current !== undefined) {
      counts.set(key, current + 1);
    }
  }
  return [...counts].map(([mes, quantidade]) => ({ mes, quantidade }));
};
