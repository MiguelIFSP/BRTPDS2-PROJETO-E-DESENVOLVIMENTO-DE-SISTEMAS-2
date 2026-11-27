import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect, type ReactNode } from 'react';
import type * as ReactNative from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ReuniaoDetalheScreen from '@/app/(tabs)/(reunioes)/reuniao/[id]';
import ConvitesSemAceite from '@/components/ConvitesSemAceite';
import ReuniaoCard from '@/components/ReuniaoCard';
import { reuniaoService } from '@/services/reuniaoService';

const mockAuth = {
  token: 'jwt',
  user: { id: 3, role: 'USER', name: 'Caio' },
};

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

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (value: typeof mockAuth) => unknown) =>
    selector(mockAuth),
}));

jest.mock('@/services/reuniaoService', () => ({
  reuniaoService: {
    getById: jest.fn(),
    delete: jest.fn(),
    inviteMembers: jest.fn(),
    respondInvite: jest.fn(),
    resendInvite: jest.fn(),
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

// Componentes com chamadas próprias à API viram um texto que o teste procura.
jest.mock('@/components/BibliotecaReuniao', () => {
  const { Text } = jest.requireActual<typeof ReactNative>('react-native');
  return function BibliotecaReuniaoMock() {
    return <Text>Biblioteca da reunião</Text>;
  };
});
jest.mock('@/components/VotacoesDaReuniao', () => {
  const { Text } = jest.requireActual<typeof ReactNative>('react-native');
  return function VotacoesDaReuniaoMock() {
    return <Text>Votações da reunião</Text>;
  };
});
jest.mock('@/components/CodigoPresencaCard', () => () => null);
jest.mock('@/components/ReuniaoCheckIn', () => {
  const { Text } = jest.requireActual<typeof ReactNative>('react-native');
  return function ReuniaoCheckInMock() {
    return <Text>Registrar presença</Text>;
  };
});
jest.mock('@/components/presenca/ListaPresencaButton', () => () => null);
jest.mock('@/components/PresencaManualActions', () => () => null);

type MockAsync = jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const getById = reuniaoService.getById as unknown as MockAsync;
const respondInvite = reuniaoService.respondInvite as unknown as MockAsync;
const resendInvite = reuniaoService.resendInvite as unknown as MockAsync;

const participante = (userId: number, nome: string, registro = null) => ({
  userId,
  nome,
  email: `${nome.toLowerCase()}@example.com`,
  papel: 'MEMBRO',
  registro,
});

const registroDeCaio = {
  id: 1,
  reuniaoId: 7,
  userId: 3,
  entradaAt: '2099-06-01T13:00:00.000Z',
  saidaAt: null,
};

const reuniaoBase = {
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
  podeGerirPresenca: false,
  meuRegistro: null,
  comissao: { id: 1, nome: 'Comissão A' },
};

// Caio (id 3) é o convidado; Ana (id 1) criou a reunião.
const vistaPeloConvidado = (
  status: 'ACEITO' | 'RECUSADO',
  extra: Record<string, unknown> = {},
) => ({
  ...reuniaoBase,
  meuConvite: { id: 5, status },
  participantes:
    status === 'ACEITO'
      ? [participante(1, 'Ana'), participante(3, 'Caio')]
      : [participante(1, 'Ana')],
  convites: [{ id: 5, userId: 3, nome: 'Caio', status, podeReenviar: true }],
  ...extra,
});

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
  respondInvite.mockReset();
  resendInvite.mockReset();
  mockAuth.user = { id: 3, role: 'USER', name: 'Caio' };
});

describe('Convidado muda a resposta na tela da reunião', () => {
  it('quem aceitou vê a resposta e pode recusar', async () => {
    getById.mockResolvedValue(vistaPeloConvidado('ACEITO'));
    respondInvite.mockResolvedValue({ id: 5, status: 'RECUSADO' });

    await renderTela();
    expect(
      await screen.findByText('Você aceitou este convite.'),
    ).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole('button', { name: 'Recusar convite' }),
    );

    expect(respondInvite).toHaveBeenCalledWith('jwt', 5, 'RECUSADO');
    expect(await screen.findByText('Convite recusado.')).toBeOnTheScreen();
    expect(getById).toHaveBeenCalledTimes(2);
  });

  it('quem recusou vê a reunião, pode aceitar e não vê presença nem arquivos', async () => {
    getById.mockResolvedValue(vistaPeloConvidado('RECUSADO'));
    respondInvite.mockResolvedValue({ id: 5, status: 'ACEITO' });

    await renderTela();
    expect(
      await screen.findByText('Você recusou este convite.'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Participantes' }));
    expect(screen.queryByText('Registrar presença')).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: 'Reunião' }));
    expect(screen.queryByText('Biblioteca da reunião')).toBeNull();
    expect(screen.queryByText('Votações da reunião')).toBeNull();
    expect(
      screen.getByText(
        'Aceite o convite para ver os arquivos, as votações e a ata.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Dados' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Aceitar convite' }),
    );
    expect(respondInvite).toHaveBeenCalledWith('jwt', 5, 'ACEITO');
    expect(await screen.findByText('Convite aceito.')).toBeOnTheScreen();
  });

  it('quem já registrou presença não pode recusar', async () => {
    getById.mockResolvedValue(
      vistaPeloConvidado('ACEITO', {
        meuRegistro: registroDeCaio,
        convites: [
          {
            id: 5,
            userId: 3,
            nome: 'Caio',
            status: 'ACEITO',
            podeReenviar: false,
          },
        ],
      }),
    );

    await renderTela();
    const botao = await screen.findByRole('button', {
      name: 'Recusar convite',
    });

    expect(botao).toBeDisabled();
    expect(
      screen.getByText(
        'Você já registrou presença ou votou nesta reunião, então não pode mais recusar.',
      ),
    ).toBeOnTheScreen();
  });

  it('depois do fim da reunião a resposta não muda', async () => {
    getById.mockResolvedValue(
      vistaPeloConvidado('RECUSADO', { data: '2020-01-10' }),
    );

    await renderTela();
    const botao = await screen.findByRole('button', {
      name: 'Aceitar convite',
    });

    expect(botao).toBeDisabled();
    expect(
      screen.getByText('A reunião já terminou; a resposta não muda mais.'),
    ).toBeOnTheScreen();
  });
});

describe('Organizador reenvia convites', () => {
  const vistaPeloOrganizador = {
    ...reuniaoBase,
    meuConvite: null,
    participantes: [
      participante(1, 'Ana'),
      participante(4, 'Bia'),
      participante(5, 'Davi'),
    ],
    convites: [
      {
        id: 5,
        userId: 3,
        nome: 'Caio',
        status: 'RECUSADO',
        podeReenviar: true,
      },
      { id: 6, userId: 4, nome: 'Bia', status: 'ACEITO', podeReenviar: true },
      { id: 7, userId: 5, nome: 'Davi', status: 'ACEITO', podeReenviar: false },
    ],
  };

  beforeEach(() => {
    mockAuth.user = { id: 1, role: 'USER', name: 'Ana' };
    getById.mockResolvedValue(vistaPeloOrganizador);
    resendInvite.mockImplementation(async (_token, inviteId) => ({
      message:
        inviteId === 5
          ? 'Convite reenviado para Caio.'
          : 'Convite reenviado para Bia.',
    }));
  });

  it('reenvia na hora para quem recusou', async () => {
    await renderTela();
    await screen.findByText('Pauta do dia');
    await fireEvent.press(screen.getByRole('tab', { name: 'Participantes' }));

    await fireEvent.press(
      screen.getByRole('button', { name: 'Reenviar convite para Caio' }),
    );

    expect(resendInvite).toHaveBeenCalledWith('jwt', 5);
    expect(
      await screen.findByText('Convite reenviado para Caio.'),
    ).toBeOnTheScreen();
  });

  it('pede confirmação antes de reenviar para quem aceitou', async () => {
    await renderTela();
    await screen.findByText('Pauta do dia');
    await fireEvent.press(screen.getByRole('tab', { name: 'Participantes' }));

    await fireEvent.press(
      screen.getByRole('button', { name: 'Reenviar convite para Bia' }),
    );
    expect(resendInvite).not.toHaveBeenCalled();
    expect(screen.getByText('Reenviar convite?')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Reenviar' }));

    expect(resendInvite).toHaveBeenCalledWith('jwt', 6);
    expect(
      await screen.findByText('Convite reenviado para Bia.'),
    ).toBeOnTheScreen();
  });

  it('não oferece reenvio a quem já participou', async () => {
    await renderTela();
    await screen.findByText('Pauta do dia');
    await fireEvent.press(screen.getByRole('tab', { name: 'Participantes' }));

    expect(screen.getByText('Davi')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: 'Reenviar convite para Davi' }),
    ).toBeNull();
  });

  it('não mostra o card de resposta para quem não foi convidado', async () => {
    await renderTela();
    await screen.findByText('Pauta do dia');
    expect(screen.queryByText('Seu convite')).toBeNull();
  });
});

describe('Convites sem aceite', () => {
  it('nome e status ficam na mesma coluna, que encolhe sem disputar a linha com o botão', async () => {
    await render(
      <ConvitesSemAceite
        convites={[
          {
            id: 5,
            nome: 'Maria Aparecida dos Santos',
            status: 'PENDENTE',
            podeReenviar: true,
          },
        ]}
        onResend={jest.fn()}
      />,
    );

    const coluna = screen.getByText('Maria Aparecida dos Santos').parent;
    expect(coluna).toBe(screen.getByText('Aguardando resposta').parent);
    expect(coluna?.props.style).toMatchObject({ flex: 1, minWidth: 0 });
    expect(
      screen.getByRole('button', {
        name: 'Reenviar convite para Maria Aparecida dos Santos',
      }),
    ).toBeOnTheScreen();
  });
});

describe('Lista de reuniões', () => {
  it('marca a reunião com convite recusado', async () => {
    await render(
      <ReuniaoCard
        reuniao={{
          ...reuniaoBase,
          status: 'AGENDADA',
          meuConvite: { id: 5, status: 'RECUSADO' },
        }}
        onPress={jest.fn()}
      />,
    );
    expect(screen.getByText('Recusado')).toBeOnTheScreen();
  });
});
