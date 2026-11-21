import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import BackButton from '@/components/ui/BackButton';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => mockCanGoBack,
  }),
}));

beforeEach(() => {
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack = true;
});

it('volta na pilha quando há tela anterior', async () => {
  await render(<BackButton fallbackHref="/mais/relatorios" />);
  await fireEvent.press(screen.getByLabelText('Voltar'));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

it('sem histórico, leva ao destino de reserva', async () => {
  mockCanGoBack = false;
  await render(<BackButton fallbackHref="/mais/relatorios" />);
  await fireEvent.press(screen.getByLabelText('Voltar'));
  expect(mockReplace).toHaveBeenCalledWith('/mais/relatorios');
  expect(mockBack).not.toHaveBeenCalled();
});
