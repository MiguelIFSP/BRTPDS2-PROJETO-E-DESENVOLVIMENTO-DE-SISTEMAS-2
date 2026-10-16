import type { AuthUser } from '@/store/authStore';
import { apiRequest } from '@/utils/apiClient';

export type LoginResponse = AuthUser & {
  themePreference: string | null;
  token: string;
};

type MessageResponse = { message: string };

// Rotas públicas: quem chama ainda não tem token.
export const authService = {
  login(identifier: string, password: string) {
    return apiRequest<LoginResponse>('/login', {
      method: 'POST',
      body: { identifier, password },
      fallbackError: 'Não foi possível entrar.',
    });
  },

  // UC02 — recuperação de conta.
  forgotPassword(email: string, newPassword: string) {
    return apiRequest<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email, newPassword },
      fallbackError: 'Não foi possível redefinir a senha.',
    });
  },
};
