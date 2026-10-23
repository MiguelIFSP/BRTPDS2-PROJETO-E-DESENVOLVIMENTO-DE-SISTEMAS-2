import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type * as ReactNative from 'react-native';

import NotificacoesList from '@/components/NotificacoesList';
import type { Notificacao } from '@/services/notificacaoService';

// O gesto real não roda no Jest: o mock expõe um botão que dispara o mesmo
// callback de quando o arrasto passa do limite.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const { Pressable, Text, View } =
    jest.requireActual<typeof ReactNative>('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onSwipeableOpen,
    }: {
      children: ReactNode;
      onSwipeableOpen: (direction: string) => void;
    }) => (
      <View>
        {children}
        <Pressable
          accessibilityLabel="arrastar"
          onPress={() => onSwipeableOpen('left')}
        >
          <Text>arrastar</Text>
        </Pressable>
      </View>
    ),
  };
});

const notificacoes: Notificacao[] = [
  {
    id: 1,
    tipo: 'REUNIAO_ATUALIZADA',
    titulo: 'Reunião remarcada',
    mensagem: '"Planejamento" agora será em 21/10/2026.',
    reuniaoId: 3,
    lidaAt: null,
    createdAt: '2026-10-22T15:00:00.000Z',
  },
  {
    id: 2,
    tipo: 'REUNIAO_EXCLUIDA',
    titulo: 'Reunião excluída',
    mensagem: '"Retro" foi excluída.',
    reuniaoId: 4,
    lidaAt: null,
    createdAt: '2026-10-22T16:00:00.000Z',
  },
];

const renderList = (lista = notificacoes) => {
  const onRemove = jest.fn();
  const onRemoveAll = jest.fn();
  return {
    onRemove,
    onRemoveAll,
    view: render(
      <NotificacoesList
        notificacoes={lista}
        onRemove={onRemove}
        onRemoveAll={onRemoveAll}
      />,
    ),
  };
};

describe('NotificacoesList', () => {
  it('remove um aviso pelo X', async () => {
    const { onRemove, view } = renderList();
    await view;

    await fireEvent.press(
      screen.getByLabelText('Remover notificação Reunião excluída'),
    );

    expect(onRemove).toHaveBeenCalledWith(2);
  });

  it('remove um aviso ao arrastar para o lado', async () => {
    const { onRemove, view } = renderList();
    await view;

    await fireEvent.press(screen.getAllByLabelText('arrastar')[0]!);

    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('limpar todas pede um segundo toque antes de remover', async () => {
    const { onRemoveAll, view } = renderList();
    await view;

    await fireEvent.press(
      screen.getByLabelText('Limpar todas as notificações'),
    );
    expect(onRemoveAll).not.toHaveBeenCalled();
    expect(screen.getByText('Tocar de novo para limpar')).toBeTruthy();

    await fireEvent.press(
      screen.getByLabelText('Confirmar limpeza de todas as notificações'),
    );
    expect(onRemoveAll).toHaveBeenCalledTimes(1);
  });

  it('sem avisos, mostra o vazio e esconde o botão de limpar', async () => {
    const { view } = renderList([]);
    await view;

    expect(screen.getByText('Nenhum aviso por enquanto.')).toBeTruthy();
    expect(screen.queryByLabelText('Limpar todas as notificações')).toBeNull();
  });
});
