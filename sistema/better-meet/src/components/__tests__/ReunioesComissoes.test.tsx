import { beforeEach, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ReunioesScreen from '@/app/(tabs)/(reunioes)';
import { comissaoService, type Comissao } from '@/services/comissaoService';
import { notificacaoService } from '@/services/notificacaoService';
import { organizacaoService } from '@/services/organizacaoService';
import { reuniaoService } from '@/services/reuniaoService';

jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@/components/ui/Screen', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/components/ui/BottomSheet', () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) => (visible ? children : null),
}));
jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useLocalSearchParams: () => ({}),
  useRouter: () => ({ setParams: jest.fn(), push: jest.fn() }),
}));
jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      token: 'jwt-teste',
      user: { id: 7, name: 'Teste', role: 'USER' },
    }),
}));

const SEM_COMISSAO =
  'Não é possível criar reuniões: você não participa de nenhuma comissão. Peça a quem administra uma comissão para incluir você na equipe.';

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
  jest.spyOn(reuniaoService, 'listMine').mockResolvedValue([]);
  jest.spyOn(reuniaoService, 'listPendingInvites').mockResolvedValue([]);
  jest.spyOn(notificacaoService, 'listMine').mockResolvedValue([]);
  jest.spyOn(comissaoService, 'getById').mockResolvedValue({
    id: 1,
    nome: 'Comissão de Ensino',
    organizacaoId: 1,
    descricao: null,
    createdAt: '',
    organizacao: { id: 1, nome: 'Organização' },
    equipe: [],
  });
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

it('lista só as comissões em que o usuário está na equipe', async () => {
  listByOrganizacao.mockResolvedValue([
    comissao(1, 'Comissão de Ensino', [7, 8]),
    comissao(2, 'Comissão de Finanças', [8]),
  ]);
  await render(<ReunioesScreen />);
  await screen.findByText('Você ainda não tem reuniões agendadas.');
  await fireEvent.press(screen.getByLabelText('Adicionar reunião'));

  expect(
    await screen.findByLabelText('Selecionar comissão Comissão de Ensino'),
  ).toBeOnTheScreen();
  expect(
    screen.queryByLabelText('Selecionar comissão Comissão de Finanças'),
  ).toBeNull();
});

it('avisa que não é possível criar reunião sem comissão e não abre o formulário', async () => {
  listByOrganizacao.mockResolvedValue([
    comissao(2, 'Comissão de Finanças', [8]),
  ]);
  await render(<ReunioesScreen />);
  await screen.findByText('Você ainda não tem reuniões agendadas.');
  await fireEvent.press(screen.getByLabelText('Adicionar reunião'));

  expect(await screen.findByText(SEM_COMISSAO)).toBeOnTheScreen();
  expect(screen.queryByText('Nova reunião')).toBeNull();
  expect(
    screen.queryByLabelText('Selecionar comissão Comissão de Finanças'),
  ).toBeNull();
});
