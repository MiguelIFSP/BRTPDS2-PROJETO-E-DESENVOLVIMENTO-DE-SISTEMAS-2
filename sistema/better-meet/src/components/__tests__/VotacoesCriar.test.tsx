import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import VotacoesDaReuniao from '@/components/VotacoesDaReuniao';
import type * as VotacaoModule from '@/services/votacaoService';
import { useAuthStore } from '@/store/authStore';

const mockPush = jest.fn();
const mockCreate = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockList =
  jest.fn<
    (token: string, reuniaoId: number) => Promise<VotacaoModule.VotacaoResumo[]>
  >();

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useRouter: () => ({ push: mockPush }),
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

jest.mock('@/services/votacaoService', () => {
  const actual = jest.requireActual(
    '@/services/votacaoService',
  ) as typeof VotacaoModule;
  return {
    ...actual,
    votacaoService: {
      ...actual.votacaoService,
      create: (...args: unknown[]) => mockCreate(...args),
      listByReuniao: (token: string, reuniaoId: number) =>
        mockList(token, reuniaoId),
    },
  };
});

const votacao = {
  id: 4,
  titulo: 'Aprovar a pauta',
  tipo: 'ABERTA' as const,
  encerrada: false,
  createdAt: '2026-11-07T12:00:00.000Z',
  totalVotos: 2,
  votei: true,
};

describe('VotacoesDaReuniao: criação', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockList.mockReset();
    mockCreate.mockReset().mockResolvedValue({});
    mockList.mockResolvedValue([votacao]);
    useAuthStore.getState().logout();
    useAuthStore.getState().markHydrated();
    useAuthStore.getState().login(
      {
        id: 1,
        name: 'Ana Lima',
        email: 'ana@exemplo.com',
        role: 'USER',
        createdAt: '2026-10-01T00:00:00.000Z',
      },
      'token',
    );
  });

  it('cria votação secreta com resultado parcial e troca de voto', async () => {
    await render(<VotacoesDaReuniao reuniaoId={7} canManage />);
    await fireEvent.press(await screen.findByLabelText('Nova votação'));
    await fireEvent.changeText(
      screen.getByLabelText('Título'),
      'Escolher o dia',
    );
    await fireEvent.changeText(screen.getByLabelText('Opção 1'), 'Segunda');
    await fireEvent.changeText(screen.getByLabelText('Opção 2'), 'Terça');
    await fireEvent.press(screen.getByRole('button', { name: 'Secreta' }));
    await fireEvent(
      screen.getByLabelText('Mostrar resultado parcial'),
      'valueChange',
      true,
    );
    await fireEvent(
      screen.getByLabelText('Permitir trocar o voto'),
      'valueChange',
      true,
    );
    await fireEvent.press(screen.getByLabelText('Criar votação'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith('token', 7, {
      titulo: 'Escolher o dia',
      opcoes: ['Segunda', 'Terça'],
      tipo: 'SECRETA',
      mostrarParcial: true,
      permiteTrocaVoto: true,
    });
  });

  it('cria votação aberta com os padrões desligados', async () => {
    await render(<VotacoesDaReuniao reuniaoId={7} canManage />);
    await fireEvent.press(await screen.findByLabelText('Nova votação'));
    await fireEvent.changeText(
      screen.getByLabelText('Título'),
      'Escolher o dia',
    );
    await fireEvent.changeText(screen.getByLabelText('Opção 1'), 'Segunda');
    await fireEvent.changeText(screen.getByLabelText('Opção 2'), 'Terça');
    await fireEvent.press(screen.getByLabelText('Criar votação'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    expect(mockCreate).toHaveBeenCalledWith(
      'token',
      7,
      expect.objectContaining({
        tipo: 'ABERTA',
        mostrarParcial: false,
        permiteTrocaVoto: false,
      }),
    );
  });
});
