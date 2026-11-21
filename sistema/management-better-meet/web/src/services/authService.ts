import { API_URL } from '@/config/api';
import type { AuthUser } from '@/store/authStore';
import type { TemaConta } from '@/store/themeStore';

export type LoginResult = {
  user: AuthUser;
  token: string;
  themePreference: TemaConta | undefined;
};

type Body = Record<string, unknown>;

function toBody(value: unknown): Body {
  return typeof value === 'object' && value !== null ? (value as Body) : {};
}

function readApiMessage(body: Body): string | undefined {
  return typeof body.error === 'string' ? body.error : undefined;
}

async function readJson(response: Response): Promise<Body> {
  return toBody(await response.json().catch(() => ({})));
}

async function signOut(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/sign-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: '{}',
    });
  } catch (error) {
    // Encerrar a sessão no servidor é idempotente; a falha não impede sair do painel.
    console.error('Não foi possível encerrar a sessão no servidor:', error);
  }
}

export const authService = {
  /** Login por e-mail no Better Auth (C1) e leitura do perfil em /usuarios/me (C2). */
  async login(email: string, password: string): Promise<LoginResult> {
    let loginResponse: Response;
    try {
      loginResponse = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Não foi possível conectar com a API.');
    }

    const loginBody = await readJson(loginResponse);

    if (!loginResponse.ok) {
      const apiMessage = readApiMessage(loginBody);
      if (loginResponse.status === 401) throw new Error('E-mail ou senha inválidos.');
      if (loginResponse.status === 403) {
        throw new Error(apiMessage ?? 'Confirme seu e-mail para entrar. Enviamos um novo link.');
      }
      if (loginResponse.status === 429) {
        throw new Error('Muitas tentativas. Tente novamente em instantes.');
      }
      throw new Error(apiMessage ?? 'Não foi possível entrar.');
    }

    // O token de sessão vem no cabeçalho set-auth-token (plugin bearer); o corpo é o plano B.
    const token =
      loginResponse.headers.get('set-auth-token') ??
      (typeof loginBody.token === 'string' ? loginBody.token : null);
    if (!token) throw new Error('Resposta inesperada do servidor.');

    let meResponse: Response;
    try {
      meResponse = await fetch(`${API_URL}/api/usuarios/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      await signOut(token);
      throw new Error('Não foi possível conectar com a API.');
    }

    const me = await readJson(meResponse);
    if (!meResponse.ok) {
      await signOut(token);
      throw new Error(readApiMessage(me) ?? 'Não foi possível entrar.');
    }

    const { id, name, email: userEmail, role, createdAt, themePreference } = me;
    if (
      typeof id !== 'number' ||
      typeof name !== 'string' ||
      typeof userEmail !== 'string' ||
      typeof createdAt !== 'string' ||
      (role !== 'ADMIN' && role !== 'USER')
    ) {
      await signOut(token);
      throw new Error('Resposta inesperada do servidor.');
    }

    // Não deixa um token válido de usuário comum no navegador.
    if (role !== 'ADMIN') {
      await signOut(token);
      throw new Error('Este painel é restrito a administradores.');
    }

    return {
      user: { id, name, email: userEmail, role, createdAt },
      token,
      themePreference:
        themePreference === 'light' || themePreference === 'dark' || themePreference === 'system'
          ? themePreference
          : undefined,
    };
  },

  logout: signOut,
};
