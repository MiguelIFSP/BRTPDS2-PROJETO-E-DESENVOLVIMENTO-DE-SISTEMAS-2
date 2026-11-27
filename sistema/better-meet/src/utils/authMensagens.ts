import {
  MENSAGEM_LOGIN_INVALIDO,
  MENSAGEM_MUITAS_TENTATIVAS,
  type AuthErrorKind,
} from '@/services/authService';
import { NETWORK_ERROR_MESSAGE } from '@/utils/apiClient';

export const MENSAGEM_SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.';

// Não confirma se a conta existe (RF-R27): a mensagem é a mesma nos dois casos.
export const textoCodigoEnviado = (email: string) =>
  `Se ${email} estiver cadastrado, enviamos para ele um código de 6 dígitos. O código vale por 15 minutos.`;

export const MENSAGEM_SENHA_REDEFINIDA =
  'Senha redefinida. Entre com a nova senha.';

/** Mensagem do erro de login; 'unverified' tem tela própria e não passa por aqui. */
export const mensagemDeLogin = (kind: AuthErrorKind, fallback?: string) => {
  switch (kind) {
    case 'invalid':
      return MENSAGEM_LOGIN_INVALIDO;
    case 'rateLimited':
      return MENSAGEM_MUITAS_TENTATIVAS;
    case 'network':
      return NETWORK_ERROR_MESSAGE;
    default:
      return fallback ?? 'Não foi possível entrar.';
  }
};

export const textoConfirmacao = (email: string) =>
  `Quase lá! Enviamos um link de confirmação para ${email}. Toque nele para ativar sua conta e depois entre no app.`;

export const textoEmailNaoConfirmado = (email: string) =>
  `Seu e-mail ainda não foi confirmado. Reenviamos o link para ${email}. Toque nele e depois entre de novo.`;

export const textoEmailPendente = (novoEmail: string) =>
  `Enviamos um link de confirmação para ${novoEmail}. O e-mail atual continua valendo até você confirmar.`;
