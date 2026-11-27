import { beforeEach, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

import ComissaoScreen from '@/app/(tabs)/comissao';
import { comissaoService, type Comissao } from '@/services/comissaoService';
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
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      token: 'jwt-teste',
      user: { id: 7, name: 'Teste', role: 'USER' },
    }),
}));

const comissao = (id: number, nome: string, membros: number[]): Comissao => ({
  id,
  nome,
  organizacaoId: 1,
  descricao: null,
  createdAt: '',
  equipe: membros.map((userId) => ({
    comissaoId: id,
    userId,
    papel: 'MEMBRO',
  })),
});

const listByOrganizacao = jest.spyOn(comissaoService, 'listByOrganizacao');

beforeEach(() => {
  jest.spyOn(organizacaoService, 'listMine').mockResolvedValue([
    {
      id: 1,
      nome: 'Organização',
      status: 'ACEITA',
      membros: [],
      comissoes: [],
      createdAt: '',
    },
  ]);
});

it('mostra só as comissões em que o usuário está na equipe', async () => {
  listByOrganizacao.mockResolvedValue([
    comissao(1, 'Comissão de Ensino', [7, 8]),
    comissao(2, 'Comissão de Finanças', [8]),
  ]);
  await render(<ComissaoScreen />);

  expect(await screen.findByText('Comissão de Ensino')).toBeOnTheScreen();
  expect(screen.queryByText('Comissão de Finanças')).toBeNull();
});

it('sem comissão com o usuário, orienta que ele ainda não participa de nenhuma', async () => {
  listByOrganizacao.mockResolvedValue([
    comissao(2, 'Comissão de Finanças', [8]),
  ]);
  await render(<ComissaoScreen />);

  expect(
    await screen.findByText(
      'Você ainda não participa de nenhuma comissão nesta organização.',
    ),
  ).toBeOnTheScreen();
  expect(screen.queryByText('Comissão de Finanças')).toBeNull();
});
