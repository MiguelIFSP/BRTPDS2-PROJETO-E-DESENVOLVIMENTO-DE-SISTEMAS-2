import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import DesbloqueioApp from '@/components/DesbloqueioApp';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { useDesbloqueioStore } from '@/store/desbloqueioStore';
import { authenticateLocal } from '@/utils/autenticacaoLocal';

jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));
jest.mock('@/utils/autenticacaoLocal', () => ({
  authenticateLocal: jest.fn(),
  isLocalAuthInProgress: jest.fn(() => false),
}));
jest.mock('@/services/authService', () => ({
  authService: { signOut: jest.fn() },
}));

const authenticate = jest.mocked(authenticateLocal);
const signOut = jest.mocked(authService.signOut);
const user = {
  id: 3,
  name: 'Bia',
  email: 'bia@exemplo.com',
  role: 'USER' as const,
  createdAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  signOut.mockResolvedValue(undefined);
  useAuthStore.getState().login(user, 'tok');
  useDesbloqueioStore.setState({
    preferencias: { '3': { isEnabled: true, tempoMinutos: 5 } },
    ofertados: [],
    isLocked: true,
    ofertaUserId: null,
  });
});

describe('DesbloqueioApp (RF-08)', () => {
  it('abre o prompt sozinho e desbloqueia no sucesso', async () => {
    authenticate.mockResolvedValue('success');
    await render(<DesbloqueioApp />);
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('cancelar mantém o bloqueio, e "Tentar de novo" reabre o prompt', async () => {
    authenticate.mockResolvedValueOnce('cancel');
    await render(<DesbloqueioApp />);
    expect(useDesbloqueioStore.getState().isLocked).toBe(true);

    authenticate.mockResolvedValueOnce('success');
    await fireEvent.press(screen.getByText('Tentar de novo'));
    expect(authenticate).toHaveBeenCalledTimes(2);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });

  it('falha mostra o erro e mantém o bloqueio', async () => {
    authenticate.mockRejectedValue(new Error('Não reconhecido.'));
    await render(<DesbloqueioApp />);
    expect(screen.getByText('Não reconhecido.')).toBeOnTheScreen();
    expect(useDesbloqueioStore.getState().isLocked).toBe(true);
  });

  it('"Entrar com e-mail e senha" encerra a sessão guardada', async () => {
    authenticate.mockResolvedValue('cancel');
    await render(<DesbloqueioApp />);
    await fireEvent.press(screen.getByText('Entrar com e-mail e senha'));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useDesbloqueioStore.getState().isLocked).toBe(false);
  });
});
