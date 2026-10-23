import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';

import ConvitesSemAceite from '@/components/ConvitesSemAceite';
import Header from '@/components/Header';
import { useNotificacaoStore } from '@/store/notificacaoStore';

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn(), push: jest.fn() }),
}));
// O logo importa uma imagem que o Jest não resolve; o teste não depende dele.
jest.mock('@/components/IconAndTitle', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (
    selector: (state: {
      user: { name: string };
      isAuthenticated: boolean;
    }) => unknown,
  ) => selector({ user: { name: 'Teste' }, isAuthenticated: true }),
}));

describe('Header', () => {
  beforeEach(() => {
    useNotificacaoStore.setState({ convitesPendentes: 0, naoLidas: 0 });
  });

  it('soma convites pendentes e avisos não lidos no sino', async () => {
    useNotificacaoStore.setState({ convitesPendentes: 2, naoLidas: 1 });
    await render(<Header />);

    expect(
      screen.getByRole('button', { name: 'Ver notificações, 3 nova(s)' }),
    ).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('não mostra contador sem novidades e limita a exibição em 9+', async () => {
    await render(<Header />);
    expect(
      screen.getByRole('button', { name: 'Ver notificações' }),
    ).toBeTruthy();

    await act(() =>
      useNotificacaoStore.setState({ convitesPendentes: 4, naoLidas: 8 }),
    );
    expect(screen.getByText('9+')).toBeTruthy();
  });
});

describe('ConvitesSemAceite', () => {
  it('lista pendentes e recusados, sem quem aceitou', async () => {
    await render(
      <ConvitesSemAceite
        convites={[
          { id: 1, nome: 'Ana', status: 'PENDENTE' },
          { id: 2, nome: 'Bia', status: 'RECUSADO' },
          { id: 3, nome: 'Caio', status: 'ACEITO' },
        ]}
      />,
    );

    expect(screen.getByText('Ana')).toBeTruthy();
    expect(screen.getByText('Aguardando resposta')).toBeTruthy();
    expect(screen.getByText('Bia')).toBeTruthy();
    expect(screen.getByText('Recusou')).toBeTruthy();
    expect(screen.queryByText('Caio')).toBeNull();
  });

  it('não renderiza nada quando todos aceitaram', async () => {
    await render(
      <ConvitesSemAceite
        convites={[{ id: 3, nome: 'Caio', status: 'ACEITO' }]}
      />,
    );
    expect(screen.queryByText('Convites sem aceite')).toBeNull();
  });
});
