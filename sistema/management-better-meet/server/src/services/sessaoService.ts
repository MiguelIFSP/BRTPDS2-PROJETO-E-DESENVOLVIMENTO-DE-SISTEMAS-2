import { createHash } from 'node:crypto';
import { env } from '../config/env.ts';
import { AppError } from '../errors/AppError.ts';

export type PerfilSessao = {
  id: number;
  role: 'USER' | 'ADMIN';
  email: string;
  emailVerified: boolean;
};

// BR-29: o perfil pode ser reaproveitado por até 30 s; depois disso um
// administrador rebaixado ou excluído perde o acesso na próxima chamada.
export const CACHE_PERFIL_MS = 30_000;
const CACHE_MAXIMO = 500;
const TIMEOUT_MS = 3000;
const MENSAGEM_INDISPONIVEL =
  'Não foi possível validar a sessão agora. Tente novamente.';

const cache = new Map<string, { perfil: PerfilSessao; expiraEm: number }>();

// A chave é o hash do token: o token em si nunca fica guardado nem é logado.
const chaveDe = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const lerPerfil = (corpo: unknown): PerfilSessao | null => {
  if (typeof corpo !== 'object' || corpo === null) return null;
  const { id, role, email, emailVerified } = corpo as Record<string, unknown>;
  if (
    typeof id !== 'number' ||
    (role !== 'USER' && role !== 'ADMIN') ||
    typeof email !== 'string' ||
    typeof emailVerified !== 'boolean'
  ) {
    return null;
  }
  return { id, role, email, emailVerified };
};

const guardar = (chave: string, perfil: PerfilSessao) => {
  const agora = Date.now();
  for (const [existente, entrada] of cache) {
    if (entrada.expiraEm <= agora) cache.delete(existente);
  }
  if (cache.size >= CACHE_MAXIMO) {
    const maisAntiga = cache.keys().next().value;
    if (maisAntiga !== undefined) cache.delete(maisAntiga);
  }
  cache.set(chave, { perfil, expiraEm: agora + CACHE_PERFIL_MS });
};

export const sessaoService = {
  /**
   * Perfil atual de quem tem o token, lido da API de Dados (GET /api/usuarios/me).
   * Devolve `null` quando a sessão não vale mais. Qualquer falha da API de
   * Dados vira 503: nunca libera o acesso por falta de resposta.
   */
  async getProfile(token: string): Promise<PerfilSessao | null> {
    const chave = chaveDe(token);
    const emCache = cache.get(chave);
    if (emCache && emCache.expiraEm > Date.now()) return emCache.perfil;
    cache.delete(chave);

    const controle = new AbortController();
    const temporizador = setTimeout(() => controle.abort(), TIMEOUT_MS);
    let resposta: Response;
    try {
      resposta = await fetch(`${env.DATA_API_URL}/api/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controle.signal,
      });
    } catch {
      console.error('API de Dados indisponível ao validar a sessão.');
      throw new AppError(503, MENSAGEM_INDISPONIVEL);
    } finally {
      clearTimeout(temporizador);
    }

    if (resposta.status === 401) return null;
    if (resposta.status !== 200) {
      console.error(
        `API de Dados respondeu ${resposta.status} ao validar a sessão.`,
      );
      throw new AppError(503, MENSAGEM_INDISPONIVEL);
    }

    const perfil = lerPerfil(await resposta.json().catch(() => null));
    if (!perfil) {
      console.error('API de Dados devolveu um perfil fora do contrato.');
      throw new AppError(503, MENSAGEM_INDISPONIVEL);
    }
    guardar(chave, perfil);
    return perfil;
  },

  clearCache() {
    cache.clear();
  },
};
