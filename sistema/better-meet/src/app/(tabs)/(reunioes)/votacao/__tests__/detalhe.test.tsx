import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect as mockUseEffect } from 'react';
import { Text as MockText } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

import VotacaoDetalheScreen from '@/app/(tabs)/(reunioes)/votacao/[id]';
import { votacaoService, type VotacaoDetalhe } from '@/services/votacaoService';
import { useAuthStore } from '@/store/authStore';

jest.mock('expo-router', () => ({
  useFocusEffect: (callback: () => void) => mockUseEffect(callback, [callback]),
  useLocalSearchParams: () => ({ id: '4' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock('react-native-poll', () => ({
  __esModule: true,
  default: ({ choices }: { choices: { choice: string }[] }) => {
    return <MockText>{choices.map((item) => item.choice).join('|')}</MockText>;
  },
}));

const base: VotacaoDetalhe = {
  id: 4,
  reuniaoId: 7,
  titulo: 'Escolher o dia',
  tipo: 'ABERTA',
  mostrarParcial: true,
  permiteTrocaVoto: true,
  encerrada: false,
  createdAt: '2026-11-07T12:00:00.000Z',
  totalVotos: 2,
  reuniao: { id: 7, titulo: 'Planejamento' },
  podeGerir: true,
  podeVotar: true,
  meuVotoOpcaoId: null,
  meuVotoNulo: false,
  nulos: 1,
  opcoes: [
    {
      id: 1,
      texto: 'Segunda',
      votos: 1,
      votantes: [{ userId: 2, nome: 'Bia Souza' }],
    },
    { id: 2, texto: 'Terça', votos: 0, votantes: [] },
  ],
};

const getById = jest.spyOn(votacaoService, 'getById');
const mostrar = async (override: Partial<VotacaoDetalhe>) => {
  getById.mockResolvedValue({ ...base, ...override });
  await render(<VotacaoDetalheScreen />);
  await waitFor(() => expect(screen.getByText('Escolher o dia')).toBeTruthy());
};

beforeEach(() => {
  getById.mockReset();
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

describe('VotacaoDetalheScreen', () => {
  it('mostra quem votou na votação aberta para quem gere', async () => {
    await mostrar({});
    expect(screen.getByText('Quem votou')).toBeTruthy();
    expect(screen.getByText('Bia Souza')).toBeTruthy();
    expect(screen.getByText('Votos nulos: 1')).toBeTruthy();
  });

  it('esconde a lista de votantes na votação secreta', async () => {
    await mostrar({
      tipo: 'SECRETA',
      opcoes: base.opcoes.map(({ votantes: _votantes, ...opcao }) => opcao),
    });
    expect(screen.queryByText('Quem votou')).toBeNull();
    expect(screen.getByText('Votação secreta')).toBeTruthy();
  });

  it('oferece o voto nulo a quem pode votar', async () => {
    await mostrar({});
    expect(screen.getByLabelText('Voto nulo')).toBeTruthy();
  });

  it('não oferece trocar o voto quando a votação não permite', async () => {
    await mostrar({
      permiteTrocaVoto: false,
      podeVotar: false,
      meuVotoOpcaoId: 1,
    });
    expect(screen.queryByLabelText('Trocar voto')).toBeNull();
    expect(screen.queryByLabelText('Voto nulo')).toBeNull();
    expect(screen.getByText(/não permite trocá-lo/)).toBeTruthy();
  });

  it('oferece trocar o voto quando permitido', async () => {
    await mostrar({ meuVotoOpcaoId: 1 });
    expect(screen.getByLabelText('Trocar voto')).toBeTruthy();
  });

  it('esconde o resultado enquanto o parcial está oculto', async () => {
    await mostrar({
      mostrarParcial: false,
      podeVotar: false,
      meuVotoOpcaoId: 1,
      nulos: undefined,
      podeGerir: false,
      opcoes: base.opcoes.map(({ texto, id }) => ({ id, texto })),
    });
    expect(
      screen.getByText('O resultado aparece quando a votação for encerrada.'),
    ).toBeTruthy();
    expect(screen.queryByText(/Votos nulos/)).toBeNull();
  });
});
