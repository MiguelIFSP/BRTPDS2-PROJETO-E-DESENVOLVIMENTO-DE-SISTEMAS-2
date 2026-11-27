import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import type * as ReactNative from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ReuniaoDetalheScreen from '@/app/(tabs)/(reunioes)/reuniao/[id]';
import {
  reuniaoService,
  type Reuniao,
} from '@/services/reuniaoService';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockUseEffect(() => callback(), [callback]);
  },
  useLocalSearchParams: () => ({ id: '7' }),
  useRouter: () => ({ back: jest.fn(), navigate: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/hooks/useRelogio', () => ({
  useRelogio: () => new Date('2026-11-26T18:30:00.000Z'),
}));

jest.mock('@/store/authStore', () => {
  const state = {
    token: 'jwt',
    user: { id: 1, role: 'ADMIN', name: 'Administrador' },
  };
  return {
    useAuthStore: (selector: (value: typeof state) => unknown) =>
      selector(state),
  };
});

jest.mock('@/services/reuniaoService', () => ({
  reuniaoService: {
    getById: jest.fn(),
    delete: jest.fn(),
    inviteMembers: jest.fn(),
  },
}));

jest.mock('@/services/monitoringService', () => ({
  monitoringService: { reportRequestFailure: jest.fn() },
}));

jest.mock('@/components/Header', () => () => null);

jest.mock('@/services/comissaoService', () => ({
  comissaoService: { getById: jest.fn() },
  PAPEIS_COMISSAO: ['ADMINISTRADOR', 'MEMBRO'],
}));

jest.mock('@/components/BibliotecaReuniao', () => {
  const { Text } =
    jest.requireActual<typeof ReactNative>('react-native');
  function BibliotecaReuniaoMock() {
    return <Text>Biblioteca da reunião</Text>;
  }
  return BibliotecaReuniaoMock;
});
jest.mock('@/components/VotacoesDaReuniao', () => {
  const { Text } =
    jest.requireActual<typeof ReactNative>('react-native');
  function VotacoesDaReuniaoMock() {
    return <Text>Votações da reunião</Text>;
  }
  return VotacoesDaReuniaoMock;
});
jest.mock('@/components/CodigoPresencaCard', () => () => null);
jest.mock('@/components/ReuniaoCheckIn', () => () => null);
jest.mock('@/components/presenca/ListaPresencaButton', () => () => null);
jest.mock('@/components/PresencaManualActions', () => () => null);

const getById = jest.mocked(reuniaoService.getById);

const reuniao: Reuniao = {
  id: 7,
  comissaoId: 1,
  titulo: 'Reunião de teste',
  pauta: 'Pauta do dia',
  descricao: 'Descrição da reunião',
  local: 'Sala 1',
  data: '2099-06-01',
  horaInicio: '10:00',
  horaFim: '11:00',
  status: 'AGENDADA',
  criadoPorUserId: 1,
  podeGerirPresenca: true,
  participantes: [
    {
      userId: 2,
      nome: 'Ana',
      email: 'ana@example.com',
      papel: 'MEMBRO',
      registro: null,
    },
  ],
  comissao: { id: 1, nome: 'Comissão A' },
  convites: [],
};

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const renderTela = () =>
  render(<ReuniaoDetalheScreen />, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
        {children}
      </SafeAreaProvider>
    ),
  });

beforeEach(() => {
  getById.mockReset();
  getById.mockResolvedValue(reuniao);
});

describe('Abas da reunião', () => {
  it('abre em Dados e esconde participantes, arquivos e votações', async () => {
    await renderTela();

    expect(await screen.findByText('Pauta do dia')).toBeOnTheScreen();
    expect(screen.queryByText('Ana')).toBeNull();
    expect(screen.queryByText('Biblioteca da reunião')).toBeNull();
    expect(screen.queryByText('Votações da reunião')).toBeNull();
  });

  it('Participantes mostra a lista e esconde os dados', async () => {
    await renderTela();
    await screen.findByText('Pauta do dia');

    await fireEvent.press(screen.getByRole('tab', { name: 'Participantes' }));

    expect(screen.getByText('Ana')).toBeOnTheScreen();
    expect(screen.queryByText('Pauta do dia')).toBeNull();
    expect(screen.queryByText('Biblioteca da reunião')).toBeNull();
  });

  it('Reunião mostra biblioteca e votações', async () => {
    await renderTela();
    await screen.findByText('Pauta do dia');

    await fireEvent.press(screen.getByRole('tab', { name: 'Reunião' }));

    expect(screen.getByText('Biblioteca da reunião')).toBeOnTheScreen();
    expect(screen.getByText('Votações da reunião')).toBeOnTheScreen();
    expect(screen.queryByText('Pauta do dia')).toBeNull();
    expect(screen.queryByText('Ana')).toBeNull();
  });
});
