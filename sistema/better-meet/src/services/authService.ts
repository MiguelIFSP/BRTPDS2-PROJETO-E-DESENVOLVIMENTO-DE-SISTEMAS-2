import { API_URL } from '@/config/api';
import { getSessionToken, setSessionToken } from '@/lib/authClient';
import { usuarioService } from '@/services/usuarioService';
import type { AuthUser } from '@/store/authStore';
import { ApiError, apiRequest } from '@/utils/apiClient';

// Better Auth montado em /api/auth; baseUrl diferente de API_URL evita que um
// 401 daqui (login errado) seja tratado como sessão vencida.
const AUTH_URL = `${API_URL}/auth`;

// No Android e no iOS, o fetch reenvia o cookie de sessão do Better Auth sem
// Origin, e a API recusa com 403 MISSING_OR_NULL_ORIGIN. O plugin expo() da API
// usa este cabeçalho como origem (bettermeet:// está no trustedOrigins), como faz
// o cliente Expo do Better Auth. No web o navegador manda Origin e ele é ignorado.
const CABECALHO_ORIGEM_EXPO = { 'expo-origin': 'bettermeet://' } as const;

export type SessaoIniciada = {
  user: AuthUser;
  token: string;
  themePreference: string | null;
};

export type AuthErrorKind =
  'invalid' | 'unverified' | 'rateLimited' | 'network' | 'unknown';

export type CadastroData = { name: string; email: string; password: string };

type SignInResponse = { token: string | null };

const readCode = (error: ApiError) => {
  const body = error.body;
  if (typeof body !== 'object' || body === null) return undefined;
  const { code } = body as { code?: unknown };
  return typeof code === 'string' ? code : undefined;
};

export const MENSAGEM_LOGIN_INVALIDO = 'E-mail ou senha incorretos.';
export const MENSAGEM_MUITAS_TENTATIVAS =
  'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
export const MENSAGEM_EMAIL_NAO_CONFIRMADO =
  'Seu e-mail ainda não foi confirmado. Confira sua caixa de entrada.';
export const MENSAGEM_LINK_INVALIDO = 'Link ou código inválido ou expirado.';
export const MENSAGEM_CODIGO_INVALIDO =
  'Código inválido ou expirado. Confira o e-mail ou peça um novo código.';
export const MENSAGEM_CODIGO_TENTATIVAS =
  'Muitas tentativas com este código. Peça um novo código.';

export type CodeErrorKind = 'invalidCode' | 'tooManyAttempts';

/** Erro do código de 6 dígitos da troca de senha, que a tela mostra no campo. */
export const getCodeErrorKind = (error: unknown): CodeErrorKind | null => {
  if (!(error instanceof ApiError)) return null;
  switch (readCode(error)) {
    case 'INVALID_OTP':
    case 'OTP_EXPIRED':
      return 'invalidCode';
    case 'TOO_MANY_ATTEMPTS':
      return 'tooManyAttempts';
    default:
      return null;
  }
};

/** Classifica o erro de uma chamada de autenticação para a tela decidir o aviso. */
export const getAuthErrorKind = (error: unknown): AuthErrorKind => {
  if (!(error instanceof ApiError)) return 'unknown';
  if (error.status === 0) return 'network';
  if (error.status === 429) return 'rateLimited';
  const code = readCode(error);
  if (error.status === 403 && code === 'EMAIL_NOT_VERIFIED') {
    return 'unverified';
  }
  if (error.status === 401 || code === 'INVALID_EMAIL_OR_PASSWORD') {
    return 'invalid';
  }
  return 'unknown';
};

// Troca a mensagem da API pela do app, mantendo status e corpo (code).
const translate = (error: unknown): unknown => {
  if (!(error instanceof ApiError)) return error;
  switch (getAuthErrorKind(error)) {
    case 'invalid':
      return new ApiError(MENSAGEM_LOGIN_INVALIDO, error.status, error.body);
    case 'unverified':
      return new ApiError(
        MENSAGEM_EMAIL_NAO_CONFIRMADO,
        error.status,
        error.body,
      );
    case 'rateLimited':
      return new ApiError(MENSAGEM_MUITAS_TENTATIVAS, error.status, error.body);
    default:
      break;
  }
  switch (getCodeErrorKind(error)) {
    case 'invalidCode':
      return new ApiError(MENSAGEM_CODIGO_INVALIDO, error.status, error.body);
    case 'tooManyAttempts':
      return new ApiError(MENSAGEM_CODIGO_TENTATIVAS, error.status, error.body);
    default:
      return readCode(error) === 'INVALID_TOKEN'
        ? new ApiError(MENSAGEM_LINK_INVALIDO, error.status, error.body)
        : error;
  }
};

async function authCall<T>(
  path: string,
  body: unknown,
  fallbackError: string,
  token?: string | null,
) {
  try {
    return await apiRequest<T>(path, {
      method: 'POST',
      baseUrl: AUTH_URL,
      body,
      token,
      headers: CABECALHO_ORIGEM_EXPO,
      fallbackError,
    });
  } catch (error) {
    throw translate(error);
  }
}

// Rotas públicas: quem chama ainda não tem sessão.
export const authService = {
  /** Entra e já lê o perfil (id inteiro) em GET /usuarios/me. */
  async signIn(email: string, password: string): Promise<SessaoIniciada> {
    const { token } = await authCall<SignInResponse>(
      '/sign-in/email',
      { email, password },
      'Não foi possível entrar.',
      // sem credencial: o apiRequest não pode usar a sessão anterior.
      '',
    );
    if (!token) throw new ApiError('Não foi possível entrar.', 500);
    const { themePreference, ...user } = await usuarioService.getMe(token);
    return { user, token, themePreference };
  },

  /**
   * A API responde 200 igual para e-mail novo e repetido: o app nunca diz
   * "e-mail já cadastrado", só pede para confirmar o e-mail. O link do e-mail
   * abre uma página da API no navegador, não o app.
   */
  async signUp({ name, email, password }: CadastroData) {
    await authCall(
      '/sign-up/email',
      { name, email, password },
      'Não foi possível criar a conta.',
      '',
    );
  },

  /**
   * Pede o código de 6 dígitos da troca de senha. Mensagem única: só rede e
   * limite de tentativas aparecem como erro, para não denunciar se a conta existe.
   */
  async requestPasswordReset(email: string) {
    try {
      await authCall(
        '/email-otp/request-password-reset',
        { email },
        'Não foi possível enviar o código.',
        '',
      );
    } catch (error) {
      const kind = getAuthErrorKind(error);
      if (kind === 'network' || kind === 'rateLimited') throw error;
    }
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    await authCall(
      '/email-otp/reset-password',
      { email, otp, password: newPassword },
      'Não foi possível redefinir a senha.',
      '',
    );
  },

  async resendVerification(email: string) {
    await authCall(
      '/send-verification-email',
      { email },
      'Não foi possível reenviar o e-mail.',
      '',
    );
  },

  /** Melhor esforço: a sessão local é apagada mesmo se a API não responder. */
  async signOut() {
    const token = getSessionToken();
    try {
      if (token) await authCall('/sign-out', {}, 'Falha ao sair.', token);
    } catch {
      // a sessão some do aparelho de qualquer jeito.
    }
    await setSessionToken(null);
  },
};
