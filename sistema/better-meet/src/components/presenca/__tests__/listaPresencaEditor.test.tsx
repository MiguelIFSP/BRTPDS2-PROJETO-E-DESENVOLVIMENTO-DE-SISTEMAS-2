import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import ListaPresencaEditor from '@/components/presenca/ListaPresencaEditor';
import type { MembroListaPresenca } from '@/services/listaPresencaService';
import type { MarcacaoPresenca } from '@/utils/marcacoesPresenca';

const MEMBROS: MembroListaPresenca[] = [
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
  {
    userId: 10,
    nome: 'Carlos Silva',
    email: 'carlos@exemplo.com',
    papel: 'SECRETARIO',
    entrada: null,
    saida: null,
    permanenciaSegundos: 0,
    status: 'SEM_RESPOSTA',
    atrasado: false,
    saiuAntes: false,
    saidaPendente: false,
  },
];

describe('ListaPresencaEditor', () => {
  it('identifica participantes e apresenta os cinco estados com a seleção recebida', async () => {
    await render(
      <ListaPresencaEditor
        membros={MEMBROS}
        marcacoes={[{ usuarioId: 9, status: 'ATRASADO' }]}
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Bruna Souza')).toBeOnTheScreen();
    expect(screen.getByText('bruna@exemplo.com')).toBeOnTheScreen();
    expect(screen.getByText('Membro')).toBeOnTheScreen();
    expect(screen.getByText('Secretário')).toBeOnTheScreen();
    expect(screen.getAllByRole('radio')).toHaveLength(10);
    expect(
      screen.getByRole('radio', {
        name: 'Atrasado para Bruna Souza (bruna@exemplo.com)',
      }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', {
        name: 'Sem resposta para Carlos Silva (carlos@exemplo.com)',
      }),
    ).toBeChecked();
  });

  it('registra uma escolha explícita mesmo quando o estado já estava selecionado', async () => {
    const onChange = jest.fn<(marcacoes: MarcacaoPresenca[]) => void>();
    await render(
      <ListaPresencaEditor
        membros={MEMBROS}
        marcacoes={[]}
        onChange={onChange}
      />,
    );

    await fireEvent.press(
      screen.getByRole('radio', {
        name: 'Saiu antes para Bruna Souza (bruna@exemplo.com)',
      }),
    );

    expect(onChange).toHaveBeenCalledWith([
      { usuarioId: 9, status: 'SAIU_ANTES' },
    ]);
  });

  it('altera uma pessoa preservando a observação e as marcações das demais', async () => {
    const onChange = jest.fn<(marcacoes: MarcacaoPresenca[]) => void>();
    const marcacoes: MarcacaoPresenca[] = [
      { usuarioId: 9, status: 'AUSENTE', observacao: 'Ausência justificada.' },
      {
        usuarioId: 10,
        status: 'ATRASADO',
        observacao: 'Chegou após o início.',
      },
    ];
    await render(
      <ListaPresencaEditor
        membros={MEMBROS}
        marcacoes={marcacoes}
        onChange={onChange}
      />,
    );

    await fireEvent.press(
      screen.getByRole('radio', {
        name: 'Presente para Carlos Silva (carlos@exemplo.com)',
      }),
    );

    expect(onChange).toHaveBeenCalledWith([
      marcacoes[0],
      {
        usuarioId: 10,
        status: 'PRESENTE',
        observacao: 'Chegou após o início.',
      },
    ]);
    expect(marcacoes[1].status).toBe('ATRASADO');
    expect(MEMBROS[1].status).toBe('SEM_RESPOSTA');
  });

  it('mantém o estado escolhido ao preencher a observação em um editor controlado', async () => {
    const onChange = jest.fn<(marcacoes: MarcacaoPresenca[]) => void>();
    function EditorControlado() {
      const [marcacoes, setMarcacoes] = useState<MarcacaoPresenca[]>([]);
      return (
        <ListaPresencaEditor
          membros={MEMBROS}
          marcacoes={marcacoes}
          onChange={(value) => {
            setMarcacoes(value);
            onChange(value);
          }}
        />
      );
    }
    await render(<EditorControlado />);

    await fireEvent.press(
      screen.getByRole('radio', {
        name: 'Atrasado para Bruna Souza (bruna@exemplo.com)',
      }),
    );
    await fireEvent.changeText(
      screen.getByLabelText(
        'Observação opcional de Bruna Souza (bruna@exemplo.com)',
      ),
      'Chegou durante a primeira pauta.',
    );

    expect(onChange).toHaveBeenLastCalledWith([
      {
        usuarioId: 9,
        status: 'ATRASADO',
        observacao: 'Chegou durante a primeira pauta.',
      },
    ]);
    expect(
      screen.getByDisplayValue('Chegou durante a primeira pauta.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', {
        name: 'Atrasado para Bruna Souza (bruna@exemplo.com)',
      }),
    ).toBeChecked();
  });

  it('preserva o estado inicial quando a observação é a primeira edição', async () => {
    const onChange = jest.fn<(marcacoes: MarcacaoPresenca[]) => void>();
    await render(
      <ListaPresencaEditor
        membros={MEMBROS}
        marcacoes={[]}
        onChange={onChange}
      />,
    );

    const observacao = screen.getByLabelText(
      'Observação opcional de Bruna Souza (bruna@exemplo.com)',
    );
    await fireEvent.changeText(
      observacao,
      'Precisou sair para outro compromisso.',
    );

    expect(observacao).toHaveProp('maxLength', 2000);
    expect(onChange).toHaveBeenCalledWith([
      {
        usuarioId: 9,
        status: 'SAIU_ANTES',
        observacao: 'Precisou sair para outro compromisso.',
      },
    ]);
  });

  it('bloqueia seleção e observação enquanto desabilitado', async () => {
    const onChange = jest.fn<(marcacoes: MarcacaoPresenca[]) => void>();
    await render(
      <ListaPresencaEditor
        membros={MEMBROS}
        marcacoes={[]}
        onChange={onChange}
        disabled
      />,
    );

    const presente = screen.getByRole('radio', {
      name: 'Presente para Bruna Souza (bruna@exemplo.com)',
    });
    const observacao = screen.getByLabelText(
      'Observação opcional de Bruna Souza (bruna@exemplo.com)',
    );
    expect(presente).toBeDisabled();
    expect(observacao).toBeDisabled();
    await fireEvent.press(presente);
    await fireEvent.changeText(observacao, 'Não deve alterar.');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('associa os erros à posição da marcação, mesmo com membros em outra ordem', async () => {
    await render(
      <ListaPresencaEditor
        membros={MEMBROS}
        marcacoes={[
          { usuarioId: 10, status: 'SEM_RESPOSTA' },
          { usuarioId: 9, status: 'AUSENTE', observacao: 'Justificativa.' },
        ]}
        onChange={jest.fn()}
        errors={{
          presencas: 'Confira as presenças informadas.',
          'presencas[1].status': 'Escolha um status válido.',
          'presencas[1].observacao': 'A observação excede o limite.',
        }}
      />,
    );

    expect(
      screen.getByText('Confira as presenças informadas.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Escolha um status válido.')).toBeOnTheScreen();
    expect(screen.getByText('A observação excede o limite.')).toBeOnTheScreen();
  });

  it('informa quando não há participantes para marcar', async () => {
    await render(
      <ListaPresencaEditor membros={[]} marcacoes={[]} onChange={jest.fn()} />,
    );

    expect(
      screen.getByText('Nenhum participante disponível para marcar presença.'),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('radio')).toBeNull();
  });
});
