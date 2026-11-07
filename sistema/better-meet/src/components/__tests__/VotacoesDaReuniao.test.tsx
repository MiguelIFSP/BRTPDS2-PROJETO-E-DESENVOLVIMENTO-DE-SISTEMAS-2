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
const mockList =
  jest.fn<
    (
      token: string,
      reuniaoId: number,
    ) => Promise<VotacaoModule.VotacaoResumo[]>
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
      listByReuniao: (token: string, reuniaoId: number) =>
        mockList(token, reuniaoId),
    },
  };
});

const votacao = {
  id: 4,
  titulo: 'Aprovar a pauta',
  encerrada: false,
  createdAt: '2026-11-07T12:00:00.000Z',
  totalVotos: 2,
  votei: true,
};

describe('VotacoesDaReuniao', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockList.mockReset();
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

  it('mostra o botão de criar só para quem gerencia a reunião', async () => {
    const managed = await render(<VotacoesDaReuniao reuniaoId={7} canManage />);
    expect(screen.getByLabelText('Nova votação')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Aprovar a pauta')).toBeTruthy();
    });
    managed.unmount();

    await render(<VotacoesDaReuniao reuniaoId={7} canManage={false} />);
    expect(screen.queryByLabelText('Nova votação')).toBeNull();
  });

  it('abre a página da votação ao tocar no card', async () => {
    await render(<VotacoesDaReuniao reuniaoId={7} canManage={false} />);
    await waitFor(() => {
      expect(screen.getByText('Aprovar a pauta')).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText('Abrir Aprovar a pauta'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/votacao/[id]',
      params: { id: '4' },
    });
  });
});
