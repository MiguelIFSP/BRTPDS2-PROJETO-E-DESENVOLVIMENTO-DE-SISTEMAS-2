import {
  MENSAGEM_LOGIN_INVALIDO,
  MENSAGEM_MUITAS_TENTATIVAS,
  type AuthErrorKind,
} from '@/services/authService';
import { NETWORK_ERROR_MESSAGE } from '@/utils/apiClient';

export const MENSAGEM_SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.';

export const MENSAGEM_RECUPERACAO_ENVIADA =
  'Se este e-mail estiver cadastrado, enviamos um link para redefinir a senha. Ele vale por 30 minutos.';

export const MENSAGEM_LINK_VENCIDO =
  'Este link venceu ou já foi usado. Peça um novo.';

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
