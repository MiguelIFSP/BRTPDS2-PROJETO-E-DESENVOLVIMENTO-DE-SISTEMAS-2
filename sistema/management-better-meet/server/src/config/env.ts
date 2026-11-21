import 'dotenv/config';

// Variável vazia conta como ausente, para que "CHAVE=" no .env desligue o recurso.
const optionalEnv = (name: string): string | undefined =>
  process.env[name] || undefined;

// Lista separada por vírgulas, sem espaços e sem barra final: o navegador envia
// a origem sem barra final, e a comparação do CORS é textual.
export const parseCorsOrigins = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);

const parseTrustProxy = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : undefined;
};

const dataApiUrl = optionalEnv('DATA_API_URL')?.replace(/\/+$/, '');
if (!dataApiUrl) {
  throw new Error(
    'Variável de ambiente DATA_API_URL não definida (URL da API de Dados, sem barra final e sem /api).',
  );
}

export const env = {
  PORT: Number(process.env.PORT ?? 3335),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONITORING_API_URL: optionalEnv('MONITORING_API_URL')?.replace(/\/+$/, ''),
  INTERNAL_API_KEY: optionalEnv('INTERNAL_API_KEY'),
  DATA_API_URL: dataApiUrl,
  CORS_ORIGINS: parseCorsOrigins(process.env.CORS_ORIGINS),
  TRUST_PROXY: parseTrustProxy(optionalEnv('TRUST_PROXY')),
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED === 'true',
};
