import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { useEffect as mockUseEffect, type ReactNode } from 'react';

import RecuperarSenhaScreen from '@/app/recuperar-senha';
import { authService } from '@/services/authService';
import { ApiError } from '@/utils/apiClient';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useRouter: () => ({
    back: jest.fn(),
    push: mockPush,
    replace: mockReplace,
    canGoBack: () => true,
  }),
}));
jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/services/authService', () => ({
  authService: { requestPasswordReset: jest.fn() },
}));
jest.mock('@/services/monitoringService', () => ({
  monitoringService: { reportRequestFailure: jest.fn() },
}));

const pedirCodigo = jest.mocked(authService.requestPasswordReset);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('RecuperarSenhaScreen', () => {
  it('tem só o e-mail e "Enviar código", sem "Tenho um código"', async () => {
    await render(<RecuperarSenhaScreen />);

    expect(screen.getByLabelText('E-mail')).toBeOnTheScreen();
    expect(screen.getByText('Enviar código')).toBeOnTheScreen();
    expect(screen.queryByText('Tenho um código')).toBeNull();
    expect(screen.queryByText(/link/i)).toBeNull();
  });

  it('envia o código e abre a tela de nova senha com o e-mail', async () => {
    pedirCodigo.mockResolvedValueOnce(undefined);
    await render(<RecuperarSenhaScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('E-mail'),
      ' Ana@Exemplo.com ',
    );
    await fireEvent.press(screen.getByText('Enviar código'));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/redefinir-senha',
        params: { email: 'ana@exemplo.com' },
      }),
    );
    expect(pedirCodigo).toHaveBeenCalledWith('ana@exemplo.com');
  });

  it('e-mail inválido mostra o erro no campo e não envia', async () => {
    await render(<RecuperarSenhaScreen />);

    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana');
    await fireEvent.press(screen.getByText('Enviar código'));

    expect(
      await screen.findByText('Informe um e-mail válido.'),
    ).toBeOnTheScreen();
    expect(pedirCodigo).not.toHaveBeenCalled();
  });

  it('limite de tentativas mostra o erro e fica na tela', async () => {
    pedirCodigo.mockRejectedValueOnce(
      new ApiError('Muitas tentativas. Aguarde alguns minutos.', 429),
    );
    await render(<RecuperarSenhaScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('E-mail'),
      'ana@exemplo.com',
    );
    await fireEvent.press(screen.getByText('Enviar código'));

    expect(
      await screen.findByText('Muitas tentativas. Aguarde alguns minutos.'),
    ).toBeOnTheScreen();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
