import 'dotenv/config';

type Source = Record<string, string | undefined>;

const requireFrom = (source: Source, name: string): string => {
  const value = source[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Confira o .env (modelo em .env.example).`,
    );
  }
  return value;
};

// Variável vazia conta como ausente, para que "CHAVE=" no .env desligue o recurso.
const optionalFrom = (source: Source, name: string): string | undefined =>
  source[name] || undefined;

const toPositiveInt = (source: Source, name: string, fallback: number) => {
  const raw = optionalFrom(source, name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Variável de ambiente ${name} deve ser um inteiro positivo.`,
    );
  }
  return value;
};

// Origem de navegador exige igualdade exata; espaço e barra final são erro de digitação comum.
const parseOrigins = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '');

// Aceita uma fonte explícita para os testes validarem as falhas de boot sem
// mexer no process.env real.
export const loadEnv = (source: Source = process.env) => ({
  PORT: toPositiveInt(source, 'PORT', 3334),
  NODE_ENV: optionalFrom(source, 'NODE_ENV') ?? 'development',
  DATABASE_HOST: requireFrom(source, 'DATABASE_HOST'),
  DATABASE_PORT: toPositiveInt(source, 'DATABASE_PORT', 3306),
  DATABASE_NAME: requireFrom(source, 'DATABASE_NAME'),
  DATABASE_USER: requireFrom(source, 'DATABASE_USER'),
  // Sem valor padrão: senha de banco nunca tem fallback no código.
  DATABASE_PASSWORD: requireFrom(source, 'DATABASE_PASSWORD'),
  APP_DATABASE_HOST: requireFrom(source, 'APP_DATABASE_HOST'),
  APP_DATABASE_PORT: toPositiveInt(source, 'APP_DATABASE_PORT', 3306),
  APP_DATABASE_NAME: requireFrom(source, 'APP_DATABASE_NAME'),
  APP_DATABASE_USER: requireFrom(source, 'APP_DATABASE_USER'),
  APP_DATABASE_PASSWORD: requireFrom(source, 'APP_DATABASE_PASSWORD'),
  DATA_API_URL: withoutTrailingSlash(requireFrom(source, 'DATA_API_URL')),
  MANAGEMENT_API_URL: withoutTrailingSlash(
    requireFrom(source, 'MANAGEMENT_API_URL'),
  ),
  INTERNAL_API_KEY: requireFrom(source, 'INTERNAL_API_KEY'),
  // Lista vazia = nenhuma origem de navegador autorizada.
  CORS_ORIGINS: parseOrigins(source.CORS_ORIGINS),
  TRUST_PROXY: optionalFrom(source, 'TRUST_PROXY')
    ? toPositiveInt(source, 'TRUST_PROXY', 1)
    : undefined,
  RATE_LIMIT_ENABLED: source.RATE_LIMIT_ENABLED === 'true',
});

export const env = loadEnv();
