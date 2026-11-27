import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import OfertaDesbloqueioDialog from '@/components/OfertaDesbloqueioDialog';
import { useAuthStore } from '@/store/authStore';
import { getPreferencia, useDesbloqueioStore } from '@/store/desbloqueioStore';
import {
  authenticateLocal,
  isLocalAuthAvailable,
} from '@/utils/autenticacaoLocal';
import {
  clearFirstAccessWelcomePending,
  markFirstAccessWelcomePending,
} from '@/utils/firstAccessWelcome';

jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));
jest.mock('@/utils/autenticacaoLocal', () => ({
  authenticateLocal: jest.fn(),
  isLocalAuthAvailable: jest.fn(),
  isLocalAuthInProgress: jest.fn(() => false),
}));

const authenticate = jest.mocked(authenticateLocal);
const available = jest.mocked(isLocalAuthAvailable);
const TITULO = 'Abrir o app com PIN ou biometria?';
const user = {
  id: 9,
  name: 'Caio',
  email: 'caio@exemplo.com',
  role: 'USER' as const,
  createdAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(async () => {
  jest.clearAllMocks();
  available.mockResolvedValue(true);
  useDesbloqueioStore.setState({
    preferencias: {},
    ofertados: [],
    isLocked: false,
    ofertaUserId: null,
  });
  await clearFirstAccessWelcomePending(9);
  useAuthStore.getState().login(user, 'tok');
});

describe('OfertaDesbloqueioDialog (RF-05)', () => {
  it('sem a oferta marcada, não aparece', async () => {
    await render(<OfertaDesbloqueioDialog />);
    expect(screen.queryByText(TITULO)).toBeNull();
  });

  it('"Usar" pede o desbloqueio e liga o recurso', async () => {
    useDesbloqueioStore.getState().markOffer(9);
    authenticate.mockResolvedValue('success');
    await render(<OfertaDesbloqueioDialog />);

    await fireEvent.press(await screen.findByText('Usar PIN ou biometria'));

    const state = useDesbloqueioStore.getState();
    expect(getPreferencia(state, 9).isEnabled).toBe(true);
    expect(state.ofertados).toEqual([9]);
    expect(screen.queryByText(TITULO)).toBeNull();
  });

  it('"Agora não" fecha e não oferece de novo', async () => {
    useDesbloqueioStore.getState().markOffer(9);
    await render(<OfertaDesbloqueioDialog />);

    await fireEvent.press(await screen.findByText('Agora não'));

    expect(getPreferencia(useDesbloqueioStore.getState(), 9).isEnabled).toBe(
      false,
    );
    expect(useDesbloqueioStore.getState().ofertados).toEqual([9]);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('aparelho sem biometria nem PIN não recebe a oferta', async () => {
    available.mockResolvedValue(false);
    useDesbloqueioStore.getState().markOffer(9);
    await render(<OfertaDesbloqueioDialog />);
    expect(screen.queryByText(TITULO)).toBeNull();
  });

  it('espera a apresentação inicial fechar', async () => {
    await markFirstAccessWelcomePending(9);
    useDesbloqueioStore.getState().markOffer(9);
    await render(<OfertaDesbloqueioDialog />);
    expect(screen.queryByText(TITULO)).toBeNull();

    await act(async () => {
      await clearFirstAccessWelcomePending(9);
    });
    expect(await screen.findByText(TITULO)).toBeOnTheScreen();
  });
});
