import { expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import PerfilScreen from '@/app/(tabs)/mais/perfil';

jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    canGoBack: () => true,
  }),
}));

const mockUser = {
  id: 4821,
  name: 'Teste',
  email: 'teste@exemplo.com',
  role: 'USER' as const,
  createdAt: '2026-01-10T12:00:00.000Z',
};
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: mockUser,
      token: 'jwt-teste',
      logout: jest.fn(),
      updateUser: jest.fn(),
    }),
}));

it('não mostra o ID do usuário na tela de perfil', async () => {
  await render(<PerfilScreen />);
  expect(screen.getByText('teste@exemplo.com')).toBeOnTheScreen();
  expect(screen.queryByText('ID do usuário')).toBeNull();
  expect(screen.queryByText('4821')).toBeNull();
});
