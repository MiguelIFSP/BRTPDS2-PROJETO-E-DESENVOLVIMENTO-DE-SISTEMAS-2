import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import MembrosSelector, {
  type MembroConvidavel,
} from '@/components/MembrosSelector';

const membros: MembroConvidavel[] = [
  { id: 1, name: 'João Silva', email: 'joao@empresa.test' },
  { id: 2, name: 'Maria Souza', email: 'maria@empresa.test' },
  { id: 3, name: 'Carlos Lima', email: 'carlos@outra.test' },
];

// Controla a seleção como a tela de Reuniões faz.
function Selector({ onChange }: { onChange?: (ids: number[]) => void }) {
  const [selecionados, setSelecionados] = useState<number[]>([]);
  return (
    <MembrosSelector
      membros={membros}
      selecionados={selecionados}
      onChange={(ids) => {
        setSelecionados(ids);
        onChange?.(ids);
      }}
      emptyText="Sem membros."
    />
  );
}

const busca = () => screen.getByLabelText('Buscar membro por nome ou e-mail');

describe('MembrosSelector', () => {
  it('lista todos os membros e permite selecionar vários', async () => {
    const onChange = jest.fn();
    await render(<Selector onChange={onChange} />);

    await fireEvent.press(screen.getByLabelText('Convidar João Silva'));
    await fireEvent.press(screen.getByLabelText('Convidar Carlos Lima'));

    expect(onChange).toHaveBeenLastCalledWith([1, 3]);
    expect(screen.getByText('2 selecionado(s) de 3')).toBeTruthy();
  });

  it('busca por nome sem diferenciar acento e maiúsculas', async () => {
    await render(<Selector />);

    await fireEvent.changeText(busca(), 'JOAO');

    expect(screen.getByText('João Silva')).toBeTruthy();
    expect(screen.queryByText('Maria Souza')).toBeNull();
  });

  it('busca por e-mail e mantém a seleção de quem foi filtrado', async () => {
    const onChange = jest.fn();
    await render(<Selector onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText('Convidar Maria Souza'));

    await fireEvent.changeText(busca(), 'outra.test');
    expect(screen.queryByText('Maria Souza')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Convidar Carlos Lima'));

    expect(onChange).toHaveBeenLastCalledWith([2, 3]);
  });

  it('avisa quando a busca não encontra ninguém', async () => {
    await render(<Selector />);
    await fireEvent.changeText(busca(), 'zzz');
    expect(
      screen.getByText('Nenhum membro encontrado para "zzz".'),
    ).toBeTruthy();
  });

  it('mostra o texto vazio quando não há membros', async () => {
    await render(
      <MembrosSelector
        membros={[]}
        selecionados={[]}
        onChange={() => {}}
        emptyText="Sem membros."
      />,
    );
    expect(screen.getByText('Sem membros.')).toBeTruthy();
    expect(
      screen.queryByLabelText('Buscar membro por nome ou e-mail'),
    ).toBeNull();
  });
});
