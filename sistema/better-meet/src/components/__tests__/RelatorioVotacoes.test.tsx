import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect } from 'react';
import { render, screen } from '@testing-library/react-native';

import RelatorioVotacoes from '@/components/RelatorioVotacoes';
import { votacaoService } from '@/services/votacaoService';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
}));

jest.mock('@/services/votacaoService', () => ({
  rotuloDeVotos: (total: number) => (total === 1 ? '1 voto' : `${total} votos`),
  votacaoService: { relatorio: jest.fn() },
}));

const relatorio = votacaoService.relatorio as unknown as jest.Mock;

const votacao = (
  parcial: Record<string, unknown> & { id: number; titulo: string },
) => ({
  tipo: 'ABERTA',
  totalVotos: 1,
  nulos: 0,
  opcoes: [],
  ...parcial,
});

beforeEach(() => {
  relatorio.mockReset();
});

describe('Relatório das votações', () => {
  it('mostra o placar e os nomes só quando a API envia', async () => {
    relatorio.mockResolvedValue({
      reuniao: {
        id: 7,
        titulo: 'Planejamento',
        comissao: 'Comissão A',
        data: '2026-10-21',
        horaInicio: '10:00',
        horaFim: '11:00',
      },
      votacoes: [
        votacao({
          id: 1,
          titulo: 'Aprovar a pauta',
          totalVotos: 2,
          nulos: 1,
          opcoes: [
            {
              id: 10,
              texto: 'Sim',
              votos: 1,
              votantes: [{ userId: 7, nome: 'Ana' }],
            },
          ],
        }),
        votacao({
          id: 2,
          titulo: 'Escolher a data',
          tipo: 'SECRETA',
          opcoes: [{ id: 11, texto: 'Segunda', votos: 1 }],
        }),
      ],
    });

    await render(<RelatorioVotacoes token="jwt" reuniaoId={7} />);

    expect(await screen.findByText('Aprovar a pauta')).toBeOnTheScreen();
    expect(screen.getByText('Aberta · 2 votos')).toBeOnTheScreen();
    expect(screen.getByText('Sim · 1')).toBeOnTheScreen();
    expect(screen.getByText('Ana')).toBeOnTheScreen();
    expect(screen.getByText('Nulos · 1')).toBeOnTheScreen();
    expect(screen.getByText('Escolher a data')).toBeOnTheScreen();
    expect(screen.getByText('Secreta · 1 voto')).toBeOnTheScreen();
    expect(screen.getByText('Segunda · 1')).toBeOnTheScreen();
  });
});
