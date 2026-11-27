import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Minutos em segundo plano antes de pedir o desbloqueio de novo; 0 = sempre.
export const TEMPOS_BLOQUEIO = [0, 1, 5, 15] as const;
export type TempoBloqueio = (typeof TEMPOS_BLOQUEIO)[number];

export type PreferenciaDesbloqueio = {
  isEnabled: boolean;
  tempoMinutos: TempoBloqueio;
};

export const PREFERENCIA_PADRAO = {
  isEnabled: false,
  tempoMinutos: 5,
} as const satisfies PreferenciaDesbloqueio;

type DesbloqueioState = {
  // por usuário: outra conta no mesmo aparelho não herda a escolha (RF-04).
  preferencias: Record<string, PreferenciaDesbloqueio>;
  // contas que já receberam a oferta depois do primeiro login (RF-05).
  ofertados: number[];
  // só em memória: ao fechar e abrir o app, o restoreSession decide de novo.
  isLocked: boolean;
  ofertaUserId: number | null;
  enable: (userId: number) => void;
  disable: (userId: number) => void;
  setTempo: (userId: number, tempoMinutos: TempoBloqueio) => void;
  lock: (userId: number) => void;
  unlock: () => void;
  markOffer: (userId: number) => void;
  finishOffer: (userId: number) => void;
};

export const getPreferencia = (
  state: Pick<DesbloqueioState, 'preferencias'>,
  userId: number,
): PreferenciaDesbloqueio =>
  state.preferencias[String(userId)] ?? PREFERENCIA_PADRAO;

export const useDesbloqueioStore = create<DesbloqueioState>()(
  persist(
    (set, get) => {
      const updatePreferencia = (
        userId: number,
        changes: Partial<PreferenciaDesbloqueio>,
      ) =>
        set((state) => ({
          preferencias: {
            ...state.preferencias,
            [String(userId)]: { ...getPreferencia(state, userId), ...changes },
          },
        }));

      return {
        preferencias: {},
        ofertados: [],
        isLocked: false,
        ofertaUserId: null,
        enable: (userId) => updatePreferencia(userId, { isEnabled: true }),
        disable: (userId) => updatePreferencia(userId, { isEnabled: false }),
        setTempo: (userId, tempoMinutos) =>
          updatePreferencia(userId, { tempoMinutos }),
        // Só bloqueia quem ligou o recurso; quem não ligou segue sem bloqueio.
        lock: (userId) => {
          if (getPreferencia(get(), userId).isEnabled) set({ isLocked: true });
        },
        unlock: () => set({ isLocked: false }),
        markOffer: (userId) => {
          const state = get();
          if (
            state.ofertados.includes(userId) ||
            getPreferencia(state, userId).isEnabled
          ) {
            return;
          }
          set({ ofertaUserId: userId });
        },
        finishOffer: (userId) =>
          set((state) => ({
            ofertaUserId: null,
            ofertados: state.ofertados.includes(userId)
              ? state.ofertados
              : [...state.ofertados, userId],
          })),
      };
    },
    {
      name: 'better-meet-desbloqueio',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        preferencias: state.preferencias,
        ofertados: state.ofertados,
      }),
    },
  ),
);
