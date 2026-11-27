import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ComponentType, EffectCallback, ReactNode } from 'react';

import DesbloqueioScreen from '@/app/(tabs)/mais/desbloqueio';
import { useAuthStore } from '@/store/authStore';
import { getPreferencia, useDesbloqueioStore } from '@/store/desbloqueioStore';
import {
  authenticateLocal,
  isLocalAuthAvailable,
} from '@/utils/autenticacaoLocal';

jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/components/ui/ScreenHeader', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => {
    const { Text } = jest.requireActual('react-native') as {
      Text: ComponentType<{ children?: ReactNode }>;
    };
    return <Text>{title}</Text>;
  },
}));
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react') as {
    useEffect: (effect: EffectCallback, deps: unknown[]) => void;
  };
  return {
    useFocusEffect: (effect: EffectCallback) => {
      useEffect(effect, [effect]);
    },
  };
});
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
const CHAVE = 'Pedir PIN ou biometria para abrir o app';
const user = {
  id: 5,
  name: 'Davi',
  email: 'davi@exemplo.com',
  role: 'USER' as const,
  createdAt: '2026-10-01T00:00:00.000Z',
};
const preferencia = () => getPreferencia(useDesbloqueioStore.getState(), 5);

beforeEach(() => {
  jest.clearAllMocks();
  available.mockResolvedValue(true);
  useAuthStore.getState().login(user, 'tok');
  useDesbloqueioStore.setState({
    preferencias: {},
    ofertados: [],
    isLocked: false,
    ofertaUserId: null,
  });
});

describe('DesbloqueioScreen (RF-02, RF-03)', () => {
  it('ligar a chave exige o desbloqueio do aparelho', async () => {
    authenticate.mockResolvedValue('success');
    await render(<DesbloqueioScreen />);

    await fireEvent(screen.getByLabelText(CHAVE), 'valueChange', true);

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(preferencia().isEnabled).toBe(true);
    expect(
      screen.getByText('Desbloqueio pelo aparelho ligado.'),
    ).toBeOnTheScreen();
  });

  it('cancelar a confirmação mantém a chave desligada', async () => {
    authenticate.mockResolvedValue('cancel');
    await render(<DesbloqueioScreen />);

    await fireEvent(screen.getByLabelText(CHAVE), 'valueChange', true);

    expect(preferencia().isEnabled).toBe(false);
    expect(
      screen.getByText(
        'Confirmação cancelada. O desbloqueio continua desligado.',
      ),
    ).toBeOnTheScreen();
  });

  it('com a chave ligada, escolhe o tempo (padrão 5 minutos)', async () => {
    useDesbloqueioStore.getState().enable(5);
    await render(<DesbloqueioScreen />);

    expect(
      screen.getByLabelText('Pedir de novo: 5 minutos').props
        .accessibilityState,
    ).toEqual(expect.objectContaining({ selected: true }));

    await fireEvent.press(
      screen.getByLabelText('Pedir de novo: imediatamente'),
    );
    expect(preferencia().tempoMinutos).toBe(0);
  });

  it('desligar não pede o desbloqueio', async () => {
    useDesbloqueioStore.getState().enable(5);
    await render(<DesbloqueioScreen />);

    await fireEvent(screen.getByLabelText(CHAVE), 'valueChange', false);

    expect(authenticate).not.toHaveBeenCalled();
    expect(preferencia().isEnabled).toBe(false);
    expect(screen.queryByText('Imediatamente')).toBeNull();
  });

  it('aparelho sem biometria nem PIN desabilita a chave e explica', async () => {
    available.mockResolvedValue(false);
    await render(<DesbloqueioScreen />);

    expect(
      await screen.findByText(/Cadastre a biometria ou um PIN/),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText(CHAVE).props.disabled).toBe(true);
  });
});
