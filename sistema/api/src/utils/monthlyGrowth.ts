export const MESES_CRESCIMENTO = 12;

// chave YYYY-MM em UTC, usada so pra bucket — a exibicao (nome do mes) fica por conta do front.
export const yearMonthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

// monta os ultimos N meses (mais antigo primeiro), cada um comecando com contagem 0.
export const lastMonthKeys = (months: number) => {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
    );
    keys.push(yearMonthKey(date));
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
