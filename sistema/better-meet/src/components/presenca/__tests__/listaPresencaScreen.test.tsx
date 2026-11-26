import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';

import ListaPresencaScreen from '@/app/(tabs)/(reunioes)/lista-presenca';
import { listaPresencaService } from '@/services/listaPresencaService';
import type { ListaPresencaDetalhada } from '@/services/listaPresencaService';
import { exportListaPresencaPdf } from '@/utils/listaPresencaPdf';

jest.mock('expo-router', () => {
  const React = jest.requireActual<typeof ReactModule>('react');
  return {
    useLocalSearchParams: () => ({ reuniaoId: '7' }),
    useFocusEffect: (effect: () => void | (() => void)) =>
      React.useEffect(effect, [effect]),
  };
});

jest.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (state: { token: string }) => unknown) =>
    selector({ token: 'token' }),
}));

jest.mock('@/services/listaPresencaService', () => ({
  listaPresencaService: {
    listByReuniao: jest.fn(),
    updateMark: jest.fn(),
    addEvent: jest.fn(),
  },
}));
jest.mock('@/utils/listaPresencaPdf', () => ({
  exportListaPresencaPdf: jest.fn(),
}));

jest.mock('@/components/ui/Screen', () => {
  const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
  return { __esModule: true, default: View };
});
jest.mock('@/components/ui/BackButton', () => ({
  __esModule: true,
  default: () => null,
}));

const LISTA: ListaPresencaDetalhada = {
  cabecalho: {
    reuniao: {
      id: 7,
      titulo: 'Revisão de pauta',
      data: '2026-11-25',
      horaInicio: '19:00',
      horaFim: '20:00',
      local: 'Sala A',
    },
    organizacao: { id: 1, nome: 'Organização de teste' },
    comissao: { id: 2, nome: 'Comissão de teste' },
  },
  participantes: [
    {
      userId: 12,
      nome: 'Pessoa convidada',
      email: 'pessoa@example.com',
      papel: 'MEMBRO',
      convite: 'ACEITO',
      status: 'SEM_MARCACAO',
      entrada: null,
      saida: null,
      marcadoPor: null,
      marcadoEm: null,
      eventos: [],
    },
  ],
  totais: { participantes: 1, presentes: 0, ausentes: 0 },
};

const service = jest.mocked(listaPresencaService);
const exportPdf = jest.mocked(exportListaPresencaPdf);

describe('ListaPresencaScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.listByReuniao.mockResolvedValue(LISTA);
  });

  it('carrega os participantes e os registros reais da reunião', async () => {
    await render(<ListaPresencaScreen />);

    expect(await screen.findByText('Pessoa convidada')).toBeOnTheScreen();
    expect(
      screen.getByText('Entrada registrada: Não registrado'),
    ).toBeOnTheScreen();
    expect(service.listByReuniao).toHaveBeenCalledWith('token', 7);
  });

  it('exporta os dados reais da lista em PDF', async () => {
    await render(<ListaPresencaScreen />);
    await screen.findByText('Pessoa convidada');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Exportar lista em PDF' }),
    );
    await waitFor(() => expect(exportPdf).toHaveBeenCalledWith(LISTA));
  });

  it('salva uma classificação e permite registrar saída com motivo opcional', async () => {
    service.updateMark.mockResolvedValue({
      ...LISTA,
      participantes: [{ ...LISTA.participantes[0]!, status: 'PRESENTE' }],
    });

    await render(<ListaPresencaScreen />);
    await screen.findByText('Pessoa convidada');
    await fireEvent.press(
      screen.getByRole('button', { name: 'Presente para Pessoa convidada' }),
    );

    await waitFor(() =>
      expect(service.updateMark).toHaveBeenCalledWith(
        'token',
        7,
        12,
        'PRESENTE',
      ),
    );
    expect(
      await screen.findByRole('button', { name: 'Registrar saída' }),
    ).toBeOnTheScreen();

    await fireEvent.changeText(
      screen.getByLabelText('Horário do evento de Pessoa convidada'),
      '19:30',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Motivo da saída de Pessoa convidada'),
      'Emergência',
    );
    service.addEvent.mockResolvedValue({
      id: 5,
      tipo: 'SAIDA',
      ocorridoAt: '2026-11-25T22:30:00.000Z',
      motivo: 'Emergência',
      registradoPor: 'Administradora',
      registradoEm: '2026-11-25T22:31:00.000Z',
    });
    service.listByReuniao.mockResolvedValueOnce({
      ...LISTA,
      participantes: [
        {
          ...LISTA.participantes[0]!,
          status: 'PRESENTE',
          eventos: [
            {
              id: 5,
              tipo: 'SAIDA',
              ocorridoAt: '2026-11-25T22:30:00.000Z',
              motivo: 'Emergência',
              registradoPor: 'Administradora',
              registradoEm: '2026-11-25T22:31:00.000Z',
            },
          ],
        },
      ],
    });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Registrar saída' }),
    );

    await waitFor(() =>
      expect(service.addEvent).toHaveBeenCalledWith('token', 7, 12, {
        tipo: 'SAIDA',
        hora: '19:30',
        motivo: 'Emergência',
      }),
    );
  });
});
