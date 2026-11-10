import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { ReactNode } from 'react';
import { View as MockView } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AtaToolbar from '@/components/ata/AtaToolbar';

jest.mock('@/components/ui/BottomSheet', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <MockView>{children}</MockView>
  ),
}));
const onFormat = jest.fn();
const onInsertTable = jest.fn();
const onPrepareTable = jest.fn();
const onTableBorder = jest.fn();
const onTableAction = jest.fn();
const props = {
  disabled: false,
  active: [],
  onFormat,
  onPrepareTable,
  onInsertTable,
  onTableBorder,
  onTableAction,
};
beforeEach(() => {
  jest.clearAllMocks();
});

describe('barra da ata', () => {
  it('usa rolagem horizontal, ícones acessíveis e estado ativo', async () => {
    await render(<AtaToolbar {...props} active={['underline']} />);
    expect(screen.getByLabelText('Formatação da ata').props.horizontal).toBe(
      true,
    );
    const underline = screen.getByRole('button', { name: 'Sublinhado' });
    expect(underline.props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Justificar' }));
    expect(onFormat).toHaveBeenCalledWith('alignJustify');
    expect(screen.queryByText('Negrito')).toBeNull();
  });
  it('bloqueia os comandos durante o salvamento', async () => {
    await render(<AtaToolbar {...props} disabled />);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Aumentar fonte' }),
    );
    await fireEvent.press(screen.getByRole('combobox', { name: 'Tabela' }));
    expect(onFormat).not.toHaveBeenCalled();
    expect(onPrepareTable).not.toHaveBeenCalled();
  });
  it('abre o menu e insere a dimensão e borda escolhidas', async () => {
    await render(<AtaToolbar {...props} />);
    await fireEvent.press(screen.getByRole('combobox', { name: 'Tabela' }));
    expect(onPrepareTable).toHaveBeenCalledTimes(1);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Aumentar linhas' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Diminuir colunas' }),
    );
    await fireEvent.press(
      screen.getByRole('radio', { name: 'Somente borda inferior' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Inserir tabela' }),
    );
    expect(onInsertTable).toHaveBeenCalledWith({
      rows: 4,
      cols: 2,
      header: true,
      border: 'bottom',
    });
  });
  it('edita a borda da tabela selecionada', async () => {
    await render(<AtaToolbar {...props} inTable tableBorder="bottom" />);
    await fireEvent.press(screen.getByRole('combobox', { name: 'Tabela' }));
    expect(
      screen.getByRole('radio', { name: 'Somente borda inferior' }).props
        .accessibilityState.checked,
    ).toBe(true);
    await fireEvent.press(
      screen.getByRole('radio', { name: 'Somente borda superior' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Aplicar bordas' }),
    );
    expect(onTableBorder).toHaveBeenCalledWith('top');
    expect(onInsertTable).not.toHaveBeenCalled();
  });
});
