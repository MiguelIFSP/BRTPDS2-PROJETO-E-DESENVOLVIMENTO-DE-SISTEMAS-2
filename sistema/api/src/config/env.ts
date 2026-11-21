import 'dotenv/config';

type Fonte = Record<string, string | undefined>;

const TAMANHO_MINIMO_SEGREDO = 32;

const urlValida = (valor: string) => {
  try {
    return Boolean(new URL(valor).host);
  } catch {
    return false;
  }
};

// Lê e valida o ambiente de uma fonte qualquer (process.env em produção), para
// o teste poder variar as variáveis sem tocar no process.env.
export const lerEnv = (fonte: Fonte) => {
  const requireEnv = (name: string): string => {
    const value = fonte[name];
    if (!value) {
      throw new Error(
        `Variável de ambiente ${name} não definida. Confira o .env (modelo em .env.example).`,
      );
    }
    return value;
  };

  // Variável vazia conta como ausente, para que "CHAVE=" no .env desligue o recurso.
  const optionalEnv = (name: string): string | undefined =>
    fonte[name] || undefined;

  const semBarraFinal = (valor: string) => valor.trim().replace(/\/+$/, '');

  const betterAuthSecret = requireEnv('BETTER_AUTH_SECRET');
  if (betterAuthSecret.length < TAMANHO_MINIMO_SEGREDO) {
    throw new Error(
      `BETTER_AUTH_SECRET deve ter pelo menos ${TAMANHO_MINIMO_SEGREDO} caracteres. Gere um com: openssl rand -base64 32.`,
    );
  }

  const betterAuthUrl = semBarraFinal(requireEnv('BETTER_AUTH_URL'));
  if (!urlValida(betterAuthUrl)) {
    throw new Error(
      'BETTER_AUTH_URL deve ser uma URL válida (ex.: http://localhost:3333).',
    );
  }

  const corsOrigins = (optionalEnv('CORS_ORIGINS') ?? '')
    .split(',')
    .map(semBarraFinal)
    .filter(Boolean);
  for (const origem of corsOrigins) {
    if (!urlValida(origem)) {
      throw new Error(
        `CORS_ORIGINS contém uma origem inválida: "${origem}". Use URLs completas separadas por vírgula.`,
      );
    }
  }

  const googleClientId = optionalEnv('GOOGLE_CLIENT_ID');
  const googleClientSecret = optionalEnv('GOOGLE_CLIENT_SECRET');
  if (Boolean(googleClientId) !== Boolean(googleClientSecret)) {
    throw new Error(
      'Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET juntos, ou nenhum dos dois.',
    );
  }

  const trustProxyBruto = optionalEnv('TRUST_PROXY');
  const trustProxy = trustProxyBruto ? Number(trustProxyBruto) : undefined;
  if (
    trustProxy !== undefined &&
    (!Number.isInteger(trustProxy) || trustProxy < 0)
  ) {
    throw new Error(
      'TRUST_PROXY deve ser um número inteiro de proxies confiáveis (ou ficar vazio).',
    );
  }

  const nodeEnv = optionalEnv('NODE_ENV') ?? 'development';
  const rateLimitEnabled = optionalEnv('RATE_LIMIT_ENABLED') === 'true';

  return {
    PORT: Number(fonte.PORT ?? 3333),
    NODE_ENV: nodeEnv,
    DATABASE_URL: requireEnv('DATABASE_URL'),
    BETTER_AUTH_SECRET: betterAuthSecret,
    BETTER_AUTH_URL: betterAuthUrl,
    CORS_ORIGINS: corsOrigins,
    // Sem as duas chaves do Google, o login social fica desligado.
    GOOGLE_CLIENT_ID: googleClientId,
    GOOGLE_CLIENT_SECRET: googleClientSecret,
    // Quantos proxies confiáveis existem na frente da API; vazio = nenhum.
    TRUST_PROXY: trustProxy,
    RATE_LIMIT_ENABLED: rateLimitEnabled,
    // O limite de tentativas fica ligado em produção ou quando pedido no .env.
    RATE_LIMIT_ATIVO: nodeEnv === 'production' || rateLimitEnabled,
    ADMIN_EMAIL: optionalEnv('ADMIN_EMAIL'),
    ADMIN_PASSWORD: optionalEnv('ADMIN_PASSWORD'),
    MONITORING_API_URL: optionalEnv('MONITORING_API_URL'),
    INTERNAL_API_KEY: optionalEnv('INTERNAL_API_KEY'),
    // Conta do Gmail que envia convites, lembretes e e-mails de conta. Sem as
    // duas, o envio de e-mail fica desligado e o resto da API funciona.
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
};

export const env = lerEnv(process.env);
