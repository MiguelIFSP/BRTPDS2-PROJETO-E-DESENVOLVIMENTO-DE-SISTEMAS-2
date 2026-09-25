import { create } from 'zustand';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
};

// De propósito, sem persist/AsyncStorage — um painel admin não deve manter
// login salvo no navegador entre sessões. Guardar o token no localStorage fazia
// a página reabrir já "autenticada" com um token velho (expirado, ou assinado com
// um JWT_SECRET que já foi regenerado), pulando a tela de login e caindo direto
// em 401 ao buscar status na monitoring. Assim, cada carregamento da página exige
// login de novo.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user: AuthUser, token: string) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
