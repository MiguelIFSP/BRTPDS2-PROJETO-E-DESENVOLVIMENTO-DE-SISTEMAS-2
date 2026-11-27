import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { getSessionToken } from '@/lib/authClient';
import * as sessionStorage from '@/lib/sessionStorage';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';

jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));

const storage = jest.mocked(sessionStorage);
const mockFetch = jest.fn<typeof fetch>();

const jsonResponse = (status: number, body: unknown) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as Response;

const user: AuthUser = {
  id: 12,
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: 'USER',
  createdAt: '2026-10-01T00:00:00.000Z',
};

const getPartialized = () => {
  const options = useAuthStore.persist.getOptions();
  return options.partialize?.(useAuthStore.getState());
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as typeof fetch;
  useAuthStore.getState().logout();
  useAuthStore.setState({ sessionExpired: false, hasHydrated: false });
});

describe('authStore (sessão)', () => {
  it('partialize persiste só o usuário, nunca o token', () => {
    useAuthStore.getState().login(user, 'segredo');
    expect(getPartialized()).toEqual({ user });
    expect(JSON.stringify(getPartialized())).not.toContain('segredo');
  });

  it('migrate descarta o token e o flag da versão antiga', () => {
    const options = useAuthStore.persist.getOptions();
    expect(options.version).toBe(2);
    const migrated = options.migrate?.(
      { user, token: 'legado', isAuthenticated: true },
      1,
    );
    expect(migrated).toEqual({ user });
  });

  it('login grava o token no armazenamento seguro e logout apaga', () => {
    useAuthStore.getState().login(user, 'tok');
    expect(storage.writeSession).toHaveBeenCalledWith('tok');
    useAuthStore.getState().logout();
    expect(storage.clearSession).toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      token: null,
      isAuthenticated: false,
      user: null,
    });
  });

  it('expireSession liga o aviso uma vez e consumeSessionExpired o apaga', () => {
    useAuthStore.getState().login(user, 'tok');
    jest.clearAllMocks();
    useAuthStore.getState().expireSession();
    useAuthStore.getState().expireSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(storage.clearSession).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().consumeSessionExpired()).toBe(true);
    expect(useAuthStore.getState().consumeSessionExpired()).toBe(false);
  });
});

describe('authStore.restoreSession', () => {
  const guardar = () => {
    useAuthStore.setState({ user });
    storage.readSession.mockResolvedValue('tok');
  };

  it('200 renova o perfil, mantém a sessão e marca hidratado', async () => {
    guardar();
    mockFetch.mockResolvedValueOnce(
      jsonResponse(200, {
        ...user,
        name: 'Ana Souza',
        emailVerified: true,
        themePreference: null,
      }),
    );

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.name).toBe('Ana Souza');
    expect(state.hasHydrated).toBe(true);
    expect(getSessionToken()).toBe('tok');
  });

  it('401 encerra a sessão', async () => {
    guardar();
    mockFetch.mockResolvedValueOnce(jsonResponse(401, { error: 'Sessão.' }));

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });

  it('erro de rede mantém o usuário guardado', async () => {
    guardar();
    mockFetch.mockRejectedValueOnce(new TypeError('rede'));

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.id).toBe(12);
    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });

  it('com o desbloqueio ligado, bloqueia antes de marcar hidratado (RF-06)', async () => {
    guardar();
    useDesbloqueioStore.setState({
      preferencias: { '12': { isEnabled: true, tempoMinutos: 5 } },
      isLocked: false,
    });
    mockFetch.mockRejectedValueOnce(new TypeError('rede'));
    let wasLockedWhenHydrated = false;
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (state.hasHydrated) {
        wasLockedWhenHydrated = useDesbloqueioStore.getState().isLocked;
      }
    });

    await useAuthStore.getState().restoreSession();
    unsubscribe();

    expect(wasLockedWhenHydrated).toBe(true);
    expect(useDesbloqueioStore.getState().isLocked).toBe(true);
  });

  it('com o desbloqueio desligado, abre sem bloqueio', async () => {
    guardar();
    useDesbloqueioStore.setState({ preferencias: {}, isLocked: false });
    mockFetch.mockRejectedValueOnce(new TypeError('rede'));
    await useAuthStore.getState().restoreSession();
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('401 na restauração tira o bloqueio junto com a sessão (RF-09)', async () => {
    guardar();
    useDesbloqueioStore.setState({
      preferencias: { '12': { isEnabled: true, tempoMinutos: 5 } },
      isLocked: false,
    });
    mockFetch.mockResolvedValueOnce(jsonResponse(401, { error: 'Sessão.' }));
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('sem token guardado fica deslogado', async () => {
    storage.readSession.mockResolvedValue(null);
    await useAuthStore.getState().restoreSession();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().hasHydrated).toBe(true);
  });
});
