import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ComissaoScreen from '@/app/(tabs)/comissao';
import OrganizacaoScreen from '@/app/(tabs)/organizacao';
import { organizacaoService } from '@/services/organizacaoService';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockParams: { origem?: string } = {};
jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    push: jest.fn(),
    canGoBack: () => mockCanGoBack,
  }),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      token: 'jwt-teste',
      user: { id: 1, name: 'Teste Silva', role: 'USER' },
    }),
}));

jest.spyOn(organizacaoService, 'listMine').mockResolvedValue([]);
jest.spyOn(organizacaoService, 'listAll').mockResolvedValue([]);
jest.spyOn(organizacaoService, 'listDisponiveis').mockResolvedValue([]);

beforeEach(() => {
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack = true;
  mockParams = {};
});

describe.each([
  ['Comissões', ComissaoScreen],
  ['Organizações', OrganizacaoScreen],
])('aba %s aberta pelo atalho do relatório', (_nome, Tela) => {
  it('não mostra o Voltar sem o parâmetro de origem', async () => {
    await render(<Tela />);
    expect(screen.queryByLabelText('Voltar')).toBeNull();
  });

  it('volta aos relatórios mesmo quando há histórico', async () => {
    mockParams = { origem: 'relatorio' };
    await render(<Tela />);
    await fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockReplace).toHaveBeenCalledWith('/mais/relatorios');
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('sem histórico, leva aos relatórios', async () => {
    mockParams = { origem: 'relatorio' };
    mockCanGoBack = false;
    await render(<Tela />);
    await fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockReplace).toHaveBeenCalledWith('/mais/relatorios');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
