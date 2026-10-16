import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Role = 'USER' | 'ADMIN';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  updateUser: (changes: Pick<AuthUser, 'name' | 'email'>) => void;
  markHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (changes) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...changes } : state.user,
        })),
      markHydrated: () => set({ hasHydrated: true }),
    }),
    {
      name: 'better-meet-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      },
    },
  ),
);
