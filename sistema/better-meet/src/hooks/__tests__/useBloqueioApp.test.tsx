import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { useBloqueioApp } from '@/hooks/useBloqueioApp';
import { useAuthStore } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';
import { isLocalAuthInProgress } from '@/utils/autenticacaoLocal';

jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));
jest.mock('@/utils/autenticacaoLocal', () => ({
  isLocalAuthInProgress: jest.fn(() => false),
}));

const inProgress = jest.mocked(isLocalAuthInProgress);
let emit: (status: AppStateStatus) => void = () => {};
let now = 0;
const user = {
  id: 7,
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: 'USER' as const,
  createdAt: '2026-10-01T00:00:00.000Z',
};

const sendStatus = (status: AppStateStatus) => act(async () => emit(status));

const goBackground = async (ms: number) => {
  await sendStatus('background');
  now += ms;
  await sendStatus('active');
};

beforeEach(() => {
  now = 1_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  inProgress.mockReturnValue(false);
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, handler) => {
    emit = handler;
    return { remove: jest.fn() };
  });
  useAuthStore.getState().login(user, 'tok');
  useDesbloqueioStore.setState({
    preferencias: { '7': { isEnabled: true, tempoMinutos: 5 } },
    ofertados: [],
    isLocked: false,
    ofertaUserId: null,
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('useBloqueioApp (RF-07)', () => {
  it('bloqueia ao voltar exatamente no tempo escolhido', async () => {
    await renderHook(() => useBloqueioApp());
    await goBackground(5 * 60_000);
    expect(useDesbloqueioStore.getState().isLocked).toBe(true);
  });

  it('não bloqueia antes do tempo escolhido', async () => {
    await renderHook(() => useBloqueioApp());
    await goBackground(5 * 60_000 - 1);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('"Imediatamente" bloqueia em qualquer ida ao segundo plano', async () => {
    useDesbloqueioStore.getState().setTempo(7, 0);
    await renderHook(() => useBloqueioApp());
    await goBackground(0);
    expect(useDesbloqueioStore.getState().isLocked).toBe(true);
  });

  it('ignora a ida ao segundo plano causada pelo prompt do app', async () => {
    useDesbloqueioStore.getState().setTempo(7, 0);
    await renderHook(() => useBloqueioApp());
    inProgress.mockReturnValue(true);
    await goBackground(60 * 60_000);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('o estado inactive (Face ID, central de controle) não bloqueia', async () => {
    useDesbloqueioStore.getState().setTempo(7, 0);
    await renderHook(() => useBloqueioApp());
    await sendStatus('inactive');
    await sendStatus('active');
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('com o recurso desligado não bloqueia', async () => {
    useDesbloqueioStore.getState().disable(7);
    await renderHook(() => useBloqueioApp());
    await goBackground(60 * 60_000);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('sem sessão nem escuta o AppState', async () => {
    useAuthStore.getState().logout();
    jest.mocked(AppState.addEventListener).mockClear();
    await renderHook(() => useBloqueioApp());
    expect(AppState.addEventListener).not.toHaveBeenCalled();
  });
});
