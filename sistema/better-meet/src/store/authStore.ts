import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { restoreSessionToken, setSessionToken } from '@/lib/authClient';
import { usuarioService } from '@/services/usuarioService';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';

export type Role = 'USER' | 'ADMIN';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  emailVerified?: boolean;
  createdAt: string;
};

type AuthState = {
  user: AuthUser | null;
  // só em memória: a sessão persiste no armazenamento seguro (lib/sessionStorage).
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  sessionExpired: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  expireSession: () => void;
  consumeSessionExpired: () => boolean;
  updateUser: (changes: Partial<AuthUser>) => void;
  replaceToken: (token: string) => void;
  markHydrated: () => void;
  restoreSession: () => Promise<void>;
};

// Uma rajada de 401 (telas carregando juntas) desloga uma vez só.
let isExpiring = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      sessionExpired: false,
      login: (user, token) => {
        isExpiring = false;
        void setSessionToken(token);
        set({ user, token, isAuthenticated: true, sessionExpired: false });
      },
      logout: () => {
        void setSessionToken(null);
        // sem sessão guardada não há o que desbloquear (RF-09).
        useDesbloqueioStore.getState().unlock();
        set({ user: null, token: null, isAuthenticated: false });
      },
      expireSession: () => {
        if (isExpiring || !get().isAuthenticated) return;
        isExpiring = true;
        set({ sessionExpired: true });
        get().logout();
      },
      consumeSessionExpired: () => {
        const wasExpired = get().sessionExpired;
        if (wasExpired) set({ sessionExpired: false });
        return wasExpired;
      },
      updateUser: (changes) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...changes } : state.user,
        })),
      replaceToken: (token) => {
        void setSessionToken(token);
        set({ token });
      },
      markHydrated: () => set({ hasHydrated: true }),
      // Reabre a sessão guardada: 200 renova o perfil, 401 encerra, falha de
      // rede mantém o usuário guardado para o app abrir offline.
      restoreSession: async () => {
        try {
          if (!useAuthStore.persist.hasHydrated()) {
            await useAuthStore.persist.rehydrate();
          }
          if (!useDesbloqueioStore.persist.hasHydrated()) {
            await useDesbloqueioStore.persist.rehydrate();
          }
          const token = await restoreSessionToken();
          const savedUser = get().user;
          if (!token || !savedUser) {
            if (token || savedUser) get().logout();
            return;
          }
          // Bloqueia antes do markHydrated: o AppGate nunca mostra as abas
          // sem o desbloqueio de quem o ligou (RF-06).
          useDesbloqueioStore.getState().lock(savedUser.id);
          set({ token, isAuthenticated: true });
          try {
            const me = await usuarioService.getMe(token);
            set({
              user: {
                ...savedUser,
                id: me.id,
                name: me.name,
                email: me.email,
                role: me.role,
                emailVerified: me.emailVerified,
                createdAt: me.createdAt,
              },
            });
          } catch (error) {
            const status = (error as { status?: number }).status;
            if (status === 401) get().logout();
          }
        } finally {
          get().markHydrated();
        }
      },
    }),
    {
      name: 'better-meet-auth',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }),
      // a versão 1 guardava token e isAuthenticated no AsyncStorage.
      migrate: (persisted) => {
        const { user = null } = (persisted ?? {}) as { user?: AuthUser | null };
        return { user };
      },
    },
  ),
);
