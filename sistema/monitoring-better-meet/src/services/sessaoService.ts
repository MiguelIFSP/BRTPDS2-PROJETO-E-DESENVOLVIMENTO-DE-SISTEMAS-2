import { createHash } from 'node:crypto';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';

export const ROLES = ['USER', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export type PerfilSessao = {
  id: number;
  role: Role;
  email: string;
  emailVerified: boolean;
};

// BR-29: o rebaixamento de papel precisa valer em até 30 s.
export const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_CACHE_MAX_ENTRIES = 500;
const SESSION_REQUEST_TIMEOUT_MS = 3_000;

const MENSAGEM_INDISPONIVEL =
  'Não foi possível validar a sessão agora. Tente novamente.';

type CacheEntry = { perfil: PerfilSessao; expiresAt: number };

// A chave é o hash do token: o token nunca fica legível em memória de cache.
const cache = new Map<string, CacheEntry>();

const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && (ROLES as readonly string[]).includes(value);

// Formato fora do contrato C2 é falha de integração, nunca "sessão inválida".
const parsePerfil = (body: unknown): PerfilSessao | null => {
  if (typeof body !== 'object' || body === null) return null;
  const { id, role, email, emailVerified } = body as Record<string, unknown>;
  if (
    typeof id !== 'number' ||
    !Number.isInteger(id) ||
    id <= 0 ||
    !isRole(role) ||
    typeof email !== 'string' ||
    !email ||
    typeof emailVerified !== 'boolean'
  ) {
    return null;
  }
  return { id, role, email, emailVerified };
};

const saveInCache = (key: string, perfil: PerfilSessao) => {
  if (cache.size >= SESSION_CACHE_MAX_ENTRIES && !cache.has(key)) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { perfil, expiresAt: Date.now() + SESSION_CACHE_TTL_MS });
};

const fetchProfile = async (token: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    SESSION_REQUEST_TIMEOUT_MS,
  );
  try {
    return await fetch(`${env.DATA_API_URL}/api/usuarios/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } catch (error) {
    // Só a mensagem vai para o log: nunca o token.
    console.error(
      'Falha ao consultar a API de Dados para validar a sessão:',
      error instanceof Error ? error.message : 'erro desconhecido',
    );
    throw new AppError(503, MENSAGEM_INDISPONIVEL);
  } finally {
    clearTimeout(timer);
  }
};

export const sessaoService = {
  /** Devolve o perfil atual (do banco da API de Dados) ou `null` se a sessão não vale. */
  async getProfile(token: string): Promise<PerfilSessao | null> {
    const key = hashToken(token);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.perfil;
    cache.delete(key);

    const response = await fetchProfile(token);
    if (response.status === 401) return null;
    if (response.status !== 200) {
      console.error(
        `API de Dados respondeu ${response.status} ao validar a sessão.`,
      );
      throw new AppError(503, MENSAGEM_INDISPONIVEL);
    }

    let perfil: PerfilSessao | null;
    try {
      perfil = parsePerfil(await response.json());
    } catch {
      perfil = null;
    }
    if (!perfil) {
      console.error('API de Dados devolveu um perfil fora do contrato C2.');
      throw new AppError(503, MENSAGEM_INDISPONIVEL);
    }
    saveInCache(key, perfil);
    return perfil;
  },
};
