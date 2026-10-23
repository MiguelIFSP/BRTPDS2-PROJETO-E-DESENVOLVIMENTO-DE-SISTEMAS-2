// O Expo só embute no app as variáveis EXPO_PUBLIC_* lidas com o nome escrito
// por extenso (process.env.EXPO_PUBLIC_X); por isso cada uma é lida aqui, e o
// resto do código importa as constantes deste arquivo.
const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `Variável de ambiente ${name} não definida. Confira o .env (modelo em .env.example).`,
    );
  }
  return value;
};

const normalizeApiUrl = (value: string) =>
  value.replace(/\/+$/, '').endsWith('/api')
    ? value.replace(/\/+$/, '')
    : `${value.replace(/\/+$/, '')}/api`;

// Aceita URLs antigas sem /api para evitar que todas as telas retornem 404.
export const API_URL = normalizeApiUrl(
  requireEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL),
);

// URL base da API de Monitoramento, já com o prefixo das rotas dela.
export const MONITORING_API_URL = requireEnv(
  'EXPO_PUBLIC_MONITORING_API_URL',
  process.env.EXPO_PUBLIC_MONITORING_API_URL,
);

// URL base da API de Gestão (start/stop/restart dos subsistemas, só ADMIN).
export const MANAGEMENT_API_URL = requireEnv(
  'EXPO_PUBLIC_MANAGEMENT_API_URL',
  process.env.EXPO_PUBLIC_MANAGEMENT_API_URL,
);

// EXCEÇÃO TEMPORÁRIA ao EX-13: a monitoring ainda exige a chave interna
// (x-api-key) no POST /status, e o app só consegue reportar erro com ela.
// Fica embutida no app (é pública) até a monitoring ser refatorada.
export const MONITORING_API_KEY = requireEnv(
  'EXPO_PUBLIC_MONITORING_API_KEY',
  process.env.EXPO_PUBLIC_MONITORING_API_KEY,
);
