import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ListaPresencaButton from '@/components/presenca/ListaPresencaButton';
import ListaPresencaView from '@/components/presenca/ListaPresencaView';
import type { PapelComissao } from '@/services/comissaoService';
import type { ListaPresenca } from '@/services/listaPresencaService';
import { useAuthStore } from '@/store/authStore';
import {
  formatListaPresencaText,
  formatPermanencia,
} from '@/utils/listaPresenca';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const LISTA: ListaPresenca = {
  id: 12,
  reuniaoId: 7,
  comissaoId: 4,
  versao: 2,
  status: 'FINAL',
  geradoPor: { id: null, nome: 'Ana Lima' },
  geradoEm: '2026-10-16T15:10:00.000Z',
  observacoes: 'Conferência dos registros.',
  urlArquivo: null,
  snapshot: {
    cabecalho: {
      organizacao: { id: 3, nome: 'Instituto Exemplo' },
      comissao: { id: 4, nome: 'Comissão de Projetos' },
      reuniao: {
        id: 7,
        titulo: 'Revisão de tarefas',
        inicio: '2026-10-16T14:00:00.000Z',
        fim: '2026-10-16T15:00:00.000Z',
        local: null,
        plataforma: 'https://meet.example.com/revisao',
      },
    },
    statusLista: 'FINAL',
    membros: [
      {
        userId: 9,
        nome: 'Bruna Souza',
        email: 'bruna@exemplo.com',
        papel: 'MEMBRO',
        entrada: '2026-10-16T14:05:00.000Z',
        saida: '2026-10-16T14:55:00.000Z',
        permanenciaSegundos: 3000,
        status: 'SAIU_ANTES',
        atrasado: true,
        saiuAntes: true,
        saidaPendente: false,
      },
    ],
    totais: {
      aceitos: 1,
      semResposta: 0,
      presentes: 0,
      atrasados: 0,
      sairamAntes: 1,
      ausentes: 0,
    },
  },
};

describe('ListaPresencaButton', () => {
  beforeEach(() => {
    mockPush.mockClear();
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

  it.each<PapelComissao>(['MEMBRO', 'FACILITADOR', 'SECRETARIO'])(
    'oculta a geração para %s',
    async (papelNaComissao) => {
      await render(
        <ListaPresencaButton reuniaoId={7} papelNaComissao={papelNaComissao} />,
      );
      expect(screen.queryByRole('button')).toBeNull();
    },
  );

  it('abre a reunião recebida sem pedir identificador ao usuário', async () => {
    await render(
      <ListaPresencaButton reuniaoId={7} papelNaComissao="ADMINISTRADOR" />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Gerar lista de presença' }),
    );

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/lista-presenca',
      params: { reuniaoId: '7' },
    });
  });

  it('permite que administrador do sistema abra a lista', async () => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Usuário de teste ausente.');
    useAuthStore.getState().login({ ...user, role: 'ADMIN' }, 'token');

    await render(<ListaPresencaButton reuniaoId={7} />);
    expect(
      screen.getByRole('button', { name: 'Gerar lista de presença' }),
    ).toBeOnTheScreen();
  });
});

describe('ListaPresencaView', () => {
  it('apresenta cabeçalho, dados do membro e rodapé da versão histórica', async () => {
    await render(<ListaPresencaView lista={LISTA} />);

    expect(screen.getByText('Instituto Exemplo')).toBeOnTheScreen();
    expect(screen.getByText('Comissão de Projetos')).toBeOnTheScreen();
    expect(screen.getByText('Revisão de tarefas')).toBeOnTheScreen();
    expect(screen.getByText('Versão 2 — Final')).toBeOnTheScreen();
    expect(screen.getByText('Bruna Souza')).toBeOnTheScreen();
    expect(screen.getByText('bruna@exemplo.com')).toBeOnTheScreen();
    expect(screen.getByText('Saiu antes')).toBeOnTheScreen();
    expect(screen.getByText('Também registrou atraso.')).toBeOnTheScreen();
    expect(screen.getByText('0h 50min 0s')).toBeOnTheScreen();
    expect(screen.getByText('Ana Lima')).toBeOnTheScreen();
    expect(screen.getByText('Conferência dos registros.')).toBeOnTheScreen();
  });

  it('identifica saída pendente sem apresentar horário inventado', async () => {
    const membro = LISTA.snapshot.membros[0];
    await render(
      <ListaPresencaView
        lista={{
          ...LISTA,
          snapshot: {
            ...LISTA.snapshot,
            membros: [{ ...membro, saida: null, saidaPendente: true }],
          },
        }}
      />,
    );

    expect(screen.getByText('Saída pendente')).toBeOnTheScreen();
  });
});

describe('Compartilhamento da lista', () => {
  it('inclui metadados, registros, observações e autor sem expor ids internos', () => {
    const text = formatListaPresencaText(LISTA);
    for (const expected of [
      'Instituto Exemplo',
      'Versão 2 — Final',
      'Bruna Souza | bruna@exemplo.com | Membro',
      'Permanência: 0h 50min 0s.',
      'Status: Saiu antes. Também registrou atraso.',
      'Conferência dos registros.',
      'Gerada por: Ana Lima',
      'Assinatura do administrador da comissão',
    ]) {
      expect(text).toContain(expected);
    }
    expect(text).not.toContain('reuniaoId');
    expect(text).not.toContain('userId');
  });

  it('mantém segundos e duração superior a um dia', () => {
    expect(formatPermanencia(90061)).toBe('25h 1min 1s');
    expect(formatPermanencia(0)).toBe('0h 0min 0s');
  });
});
