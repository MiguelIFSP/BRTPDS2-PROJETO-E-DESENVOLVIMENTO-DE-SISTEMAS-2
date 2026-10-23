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
  // Conta do Gmail que envia convites e lembretes. Sem as duas, o envio de
  // e-mail fica desligado e o resto da API funciona normalmente.
  GMAIL_USER: optionalEnv('GMAIL_USER'),
  GMAIL_APP_PASSWORD: optionalEnv('GMAIL_APP_PASSWORD'),
  MAIL_FROM_NAME: optionalEnv('MAIL_FROM_NAME') ?? 'Better Meet',
  // Endereço da API visto por quem abre o e-mail (ex.: http://192.168.0.110:3333),
  // usado nos botões Aceitar/Recusar. Sem ele, o convite sai sem os botões.
  API_PUBLIC_URL: optionalEnv('API_PUBLIC_URL')?.replace(/\/+$/, ''),
  // Fuso em que data e horário das reuniões são interpretados (o banco guarda
  // "AAAA-MM-DD" e "HH:mm" sem fuso).
  TZ_REUNIOES: optionalEnv('TZ_REUNIOES') ?? 'America/Sao_Paulo',
};
