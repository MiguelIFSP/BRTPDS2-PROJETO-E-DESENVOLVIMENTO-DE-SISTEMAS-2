import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Text as MockText } from 'react-native';
import { useEffect as mockUseEffect, type ReactNode } from 'react';

import RedefinirSenhaScreen from '@/app/redefinir-senha';
import { authService } from '@/services/authService';
import { ApiError } from '@/utils/apiClient';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams: { email?: string } = { email: 'ana@exemplo.com' };
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: mockReplace,
    canGoBack: () => true,
  }),
  Redirect: ({ href }: { href: string }) => (
    <MockText>{`redireciona para ${href}`}</MockText>
  ),
}));
jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({
    children,
    toast,
  }: {
    children: ReactNode;
    toast?: ReactNode;
  }) => (
    <>
      {children}
      {toast}
    </>
  ),
}));
jest.mock('@/components/ui/Toast', () => ({
  __esModule: true,
  default: ({ toast }: { toast: { message: string } | null }) =>
    toast ? <MockText>{toast.message}</MockText> : null,
}));
// getCodeErrorKind fica o de verdade: a tela decide pelo código do erro.
jest.mock('@/services/authService', () => ({
  ...jest.requireActual<object>('@/services/authService'),
  authService: { resetPassword: jest.fn(), requestPasswordReset: jest.fn() },
}));
jest.mock('@/services/monitoringService', () => ({
  monitoringService: { reportRequestFailure: jest.fn() },
}));

const redefinir = jest.mocked(authService.resetPassword);
const pedirCodigo = jest.mocked(authService.requestPasswordReset);

const MENSAGEM_CODIGO =
  'Código inválido ou expirado. Confira o e-mail ou peça um novo código.';

const erroDoCodigo = () =>
  new ApiError(MENSAGEM_CODIGO, 400, { code: 'INVALID_OTP' });

const preencher = async (codigo: string, senha = 'Nova12345') => {
  await fireEvent.changeText(
    screen.getByLabelText('Código de 6 dígitos'),
    codigo,
  );
  await fireEvent.changeText(screen.getByLabelText('Nova senha'), senha);
  await fireEvent.changeText(
    screen.getByLabelText('Confirmar nova senha'),
    senha,
  );
  await fireEvent.press(screen.getByText('Redefinir senha'));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { email: 'ana@exemplo.com' };
});

describe('RedefinirSenhaScreen', () => {
  it('mostra para qual e-mail foi o código e o campo de 6 dígitos numérico', async () => {
    await render(<RedefinirSenhaScreen />);

    expect(screen.getByText(/ana@exemplo\.com/)).toBeOnTheScreen();
    const campo = screen.getByLabelText('Código de 6 dígitos');
    expect(campo).toHaveProp('keyboardType', 'number-pad');
    expect(campo).toHaveProp('maxLength', 6);
    expect(campo).toHaveProp('textContentType', 'oneTimeCode');
    expect(screen.getByText('Trocar e-mail')).toBeOnTheScreen();
    expect(screen.queryByText(/link/i)).toBeNull();
  });

  it('o campo do código aceita só dígitos', async () => {
    await render(<RedefinirSenhaScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Código de 6 dígitos'),
      '48 2-91a5',
    );

    expect(screen.getByLabelText('Código de 6 dígitos')).toHaveProp(
      'value',
      '482915',
    );
  });

  it('código certo redefine a senha, avisa e volta ao login', async () => {
    redefinir.mockResolvedValueOnce(undefined);
    await render(<RedefinirSenhaScreen />);

    await preencher('482915');

    expect(
      await screen.findByText('Senha redefinida. Entre com a nova senha.'),
    ).toBeOnTheScreen();
    expect(redefinir).toHaveBeenCalledWith(
      'ana@exemplo.com',
      '482915',
      'Nova12345',
    );
  });

  it('código com menos de 6 dígitos mostra o erro no campo', async () => {
    await render(<RedefinirSenhaScreen />);

    await preencher('4829');

    expect(
      await screen.findByText('O código tem 6 dígitos.'),
    ).toBeOnTheScreen();
    expect(redefinir).not.toHaveBeenCalled();
  });

  it('código errado mostra o erro no campo e mantém a tela', async () => {
    redefinir.mockRejectedValueOnce(erroDoCodigo());
    await render(<RedefinirSenhaScreen />);

    await preencher('000000');

    expect(await screen.findByText(MENSAGEM_CODIGO)).toBeOnTheScreen();
    expect(screen.getByText('Redefinir senha')).toBeOnTheScreen();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('o erro do código some ao digitar de novo', async () => {
    redefinir.mockRejectedValueOnce(erroDoCodigo());
    await render(<RedefinirSenhaScreen />);
    await preencher('000000');
    await screen.findByText(MENSAGEM_CODIGO);

    await fireEvent.changeText(
      screen.getByLabelText('Código de 6 dígitos'),
      '1',
    );

    expect(screen.queryByText(MENSAGEM_CODIGO)).toBeNull();
  });

  it('reenviar fica em espera logo após o envio', async () => {
    await render(<RedefinirSenhaScreen />);

    expect(screen.getByText(/^Reenviar em \d+ s$/)).toBeOnTheScreen();
    expect(pedirCodigo).not.toHaveBeenCalled();
  });

  it('"Trocar e-mail" volta para a tela anterior', async () => {
    await render(<RedefinirSenhaScreen />);

    await fireEvent.press(screen.getByText('Trocar e-mail'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('sem e-mail na rota volta para Recuperar conta', async () => {
    mockParams = {};
    await render(<RedefinirSenhaScreen />);

    await waitFor(() =>
      expect(
        screen.getByText('redireciona para /recuperar-senha'),
      ).toBeOnTheScreen(),
    );
    expect(screen.queryByLabelText('Código de 6 dígitos')).toBeNull();
  });
});
