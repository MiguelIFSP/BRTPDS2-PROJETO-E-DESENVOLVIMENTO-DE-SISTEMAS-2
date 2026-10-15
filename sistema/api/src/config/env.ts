import 'dotenv/config';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Confira o .env (modelo em .env.example).`,
    );
  }
  return value;
};

// Variável vazia conta como ausente, para que "CHAVE=" no .env desligue o recurso.
const optionalEnv = (name: string): string | undefined =>
  process.env[name] || undefined;

export const env = {
  PORT: Number(process.env.PORT ?? 3333),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  ADMIN_EMAIL: optionalEnv('ADMIN_EMAIL'),
  ADMIN_PASSWORD: optionalEnv('ADMIN_PASSWORD'),
  MONITORING_API_URL: optionalEnv('MONITORING_API_URL'),
  INTERNAL_API_KEY: optionalEnv('INTERNAL_API_KEY'),
};
