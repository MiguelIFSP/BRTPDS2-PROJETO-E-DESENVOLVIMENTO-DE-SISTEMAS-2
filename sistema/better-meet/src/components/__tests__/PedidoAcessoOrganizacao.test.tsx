jest.mock('expo-secure-store', () => ({ getItemAsync: async () => null }), {
  virtual: true,
});

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import OrganizacaoScreen from '@/app/(tabs)/organizacao';
import { organizacaoService } from '@/services/organizacaoService';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useLocalSearchParams: () => ({}),
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    canGoBack: () => true,
  }),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      token: 'jwt-teste',
      user: { id: 7, name: 'Teste Silva', role: 'USER' },
    }),
}));

const disponiveis = [
  { id: 1, nome: 'Grêmio Estudantil', pedido: null },
  { id: 2, nome: 'Atlética', pedido: { status: 'PENDENTE' as const } },
  {
    id: 3,
    nome: 'Centro Acadêmico',
    pedido: { status: 'RECUSADO' as const },
  },
];

jest.spyOn(organizacaoService, 'listMine').mockResolvedValue([]);
const listDisponiveis = jest
  .spyOn(organizacaoService, 'listDisponiveis')
  .mockResolvedValue(disponiveis);
const solicitarAcesso = jest
  .spyOn(organizacaoService, 'solicitarAcesso')
  .mockResolvedValue({
    id: 1,
    organizacaoId: 1,
    userId: 7,
    status: 'PENDENTE',
    createdAt: '2026-11-26T00:00:00.000Z',
    respondidoAt: null,
    user: { id: 7, name: 'Teste Silva', email: 'teste@example.test' },
  });

beforeEach(() => {
  listDisponiveis.mockClear();
  solicitarAcesso.mockClear();
  listDisponiveis.mockResolvedValue(disponiveis);
});

describe('Pedir acesso na aba Organização', () => {
  it('lista as organizações, esconde o botão do pedido pendente e deixa pedir de novo o recusado', async () => {
    await render(<OrganizacaoScreen />);

    expect(await screen.findByText('Grêmio Estudantil')).toBeTruthy();
    expect(screen.getByText('Atlética')).toBeTruthy();
    expect(
      screen.getByText('Aguardando análise do criador ou do gerente.'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Solicitar acesso a Grêmio Estudantil'),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Solicitar acesso a Centro Acadêmico'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Solicitar acesso a Atlética')).toBeNull();
  });

  it('filtra a lista pelo nome', async () => {
    await render(<OrganizacaoScreen />);
    await screen.findByText('Grêmio Estudantil');

    const busca = screen.getByLabelText('Buscar organização');
    await fireEvent.changeText(busca, 'centro');

    expect(busca.props.value).toBe('centro');
    expect(screen.getByText('Centro Acadêmico')).toBeTruthy();
    expect(screen.queryByText('Grêmio Estudantil')).toBeNull();
    expect(screen.queryByText('Atlética')).toBeNull();
  });

  it('envia o pedido ao tocar em Solicitar acesso', async () => {
    await render(<OrganizacaoScreen />);
    await screen.findByLabelText('Solicitar acesso a Grêmio Estudantil');

    fireEvent.press(
      screen.getByLabelText('Solicitar acesso a Grêmio Estudantil'),
    );

    expect(solicitarAcesso).toHaveBeenCalledWith('jwt-teste', 1);
  });
});
