function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} precisa estar definido no .env`);
  }
  return value;
}

// URL base da API de Dados (login, usuários, organizações)
export const API_URL = requireEnv('EXPO_PUBLIC_API_URL', process.env.EXPO_PUBLIC_API_URL);
