import { clearSession, readSession, writeSession } from '@/lib/sessionStorage';

// O cliente Better Auth (better-auth/client) é ESM puro e não carrega no Jest
// nem no Metro sem configuração extra; por isso o app chama as rotas
// /api/auth/* com o apiRequest e guarda aqui só o token de sessão (Bearer).
// O token vive em memória; o armazenamento seguro só serve para reabrir o app.
let sessionToken: string | null = null;

export const getSessionToken = () => sessionToken;

/** Troca o token em memória e no armazenamento seguro (null apaga os dois). */
export async function setSessionToken(token: string | null) {
  sessionToken = token;
  if (token) await writeSession(token);
  else await clearSession();
}

export async function restoreSessionToken() {
  sessionToken = await readSession();
  return sessionToken;
}
