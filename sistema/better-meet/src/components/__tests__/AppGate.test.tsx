import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import type { ComponentType, ReactNode } from 'react';

import AppGate from '@/components/AppGate';
import { useAuthStore } from '@/store/authStore';

// Stack simulado: Protected só renderiza os filhos com o guard verdadeiro e
// Screen mostra o nome da rota.
jest.mock('expo-router/stack', () => {
  const { Text } = jest.requireActual('react-native') as {
    Text: ComponentType<{ children?: ReactNode }>;
  };
  const Screen = ({ name }: { name: string }) => <Text>{name}</Text>;
  const Protected = ({
    guard,
    children,
  }: {
    guard: boolean;
    children: ReactNode;
  }) => (guard ? children : null);
  const Stack = ({ children }: { children: ReactNode }) => children;
  Stack.Screen = Screen;
  Stack.Protected = Protected;
  return { Stack };
});
jest.mock('@/lib/sessionStorage', () => ({
  readSession: jest.fn(),
  writeSession: jest.fn(),
  clearSession: jest.fn(),
}));

const user = {
  id: 1,
  name: 'Ana',
  email: 'ana@exemplo.com',
  role: 'USER' as const,
  createdAt: '2026-10-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.getState().logout();
  useAuthStore.setState({ hasHydrated: true, sessionExpired: false });
});

describe('AppGate', () => {
  it('não renderiza nada antes de a sessão ser restaurada', async () => {
    useAuthStore.setState({ hasHydrated: false });
    await render(<AppGate />);
    expect(screen.queryByText('login')).toBeNull();
    expect(screen.queryByText('(tabs)')).toBeNull();
  });

  it('sem sessão libera o login e as rotas públicas, não as abas', async () => {
    await render(<AppGate />);
    expect(screen.getByText('login')).toBeOnTheScreen();
    expect(screen.getByText('redefinir-senha')).toBeOnTheScreen();
    expect(screen.getByText('email-confirmado')).toBeOnTheScreen();
    expect(screen.queryByText('(tabs)')).toBeNull();
  });

  it('com sessão libera as abas e esconde o login', async () => {
    useAuthStore.getState().login(user, 'tok');
    await render(<AppGate />);
    expect(screen.getByText('(tabs)')).toBeOnTheScreen();
    expect(screen.queryByText('login')).toBeNull();
  });

  it('sessão expirada tira as abas e volta ao login', async () => {
    useAuthStore.getState().login(user, 'tok');
    const { rerender } = await render(<AppGate />);
    useAuthStore.getState().expireSession();
    await rerender(<AppGate />);
    expect(screen.queryByText('(tabs)')).toBeNull();
    expect(screen.getByText('login')).toBeOnTheScreen();
    expect(useAuthStore.getState().sessionExpired).toBe(true);
  });
});
