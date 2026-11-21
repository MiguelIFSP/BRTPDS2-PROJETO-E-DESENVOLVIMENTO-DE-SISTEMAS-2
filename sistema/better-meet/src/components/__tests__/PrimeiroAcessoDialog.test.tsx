import { expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import PrimeiroAcessoDialog from '@/components/PrimeiroAcessoDialog';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() }),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (
    selector: (state: {
      isAuthenticated: boolean;
      user: { id: number };
    }) => unknown,
  ) => selector({ isAuthenticated: true, user: { id: 7 } }),
}));
jest.mock('@/utils/firstAccessWelcome', () => ({
  isFirstAccessWelcomePending: jest.fn(async () => true),
  clearFirstAccessWelcomePending: jest.fn(async () => undefined),
}));

it('chama o Better Meet de aplicativo, não de site', async () => {
  await render(<PrimeiroAcessoDialog />);
  const message = await screen.findByText(/primeiro cadastro/);
  const text = String(message.props.children).replace(/\s+/g, ' ');
  expect(text).toContain('aplicativo');
  expect(text).not.toMatch(/\bsite\b/i);
});
