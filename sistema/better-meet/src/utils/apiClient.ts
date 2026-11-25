import { API_URL } from '@/config/api';
import { getSessionToken } from '@/lib/authClient';
import { useAuthStore } from '@/store/authStore';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  baseUrl?: string;
  // 401 com credencial encerra a sessão. Padrão: só na API de Dados; monitoring
  // e gestão podem recusar por motivos próprios sem deslogar a pessoa.
  expireSessionOn401?: boolean;
  // Authorization e Content-Type são montados aqui e valem sobre estes.
  headers?: Record<string, string>;
  fallbackError: string;
};

type ApiErrorBody = { error?: string };

/**
 * Erro devolvido por apiRequest. `status` é o HTTP da resposta, ou 0 quando a
 * requisição nem chegou ao servidor (sem rede, API fora do ar). As telas usam
 * o status para decidir o que reportar à monitoring: 4xx é recusa normal.
 * `body` traz o corpo da resposta, para erros que carregam dados (ex.: 409 da
 * exclusão de conta com as pendências).
 */
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão.';

const readErrorMessage = (data: unknown) =>
  typeof data === 'object' && data !== null
    ? (data as ApiErrorBody).error
    : undefined;

// Ponto único de acesso HTTP do app: autenticação, JSON e mensagem de erro da API.
export async function apiRequest<T>(
  path: string,
  {
    method = 'GET',
    token,
    body,
    baseUrl = API_URL,
    expireSessionOn401 = baseUrl === API_URL,
    headers: extraHeaders,
    fallbackError,
  }: ApiRequestOptions,
): Promise<T> {
  const headers: Record<string, string> = { ...extraHeaders };
  delete headers.Authorization;
  delete headers['Content-Type'];
  const credential = token ?? getSessionToken();
  if (credential) headers.Authorization = `Bearer ${credential}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    // sem credencial, 401 é login errado, não sessão vencida.
    if (response.status === 401 && credential && expireSessionOn401) {
      useAuthStore.getState().expireSession();
    }
    throw new ApiError(
      readErrorMessage(data) ?? fallbackError,
      response.status,
      data,
    );
  }
  return data as T;
}

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;
