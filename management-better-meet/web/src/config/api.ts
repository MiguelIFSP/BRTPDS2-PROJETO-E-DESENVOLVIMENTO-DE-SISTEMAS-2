function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} precisa estar definido no .env`);
  }
  return value;
}

// URL base da API de Dados (login)
export const API_URL = requireEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL);

// URL base da API de monitoramento (sem o /monitoring-better-meet no final)
export const MONITORING_API_URL = requireEnv(
  'EXPO_PUBLIC_MONITORING_API_URL',
  process.env.EXPO_PUBLIC_MONITORING_API_URL
);

// URL base da API de gestão (start/stop/restart dos subsistemas)
export const MANAGEMENT_API_URL = requireEnv(
  'EXPO_PUBLIC_MANAGEMENT_API_URL',
  process.env.EXPO_PUBLIC_MANAGEMENT_API_URL
);
