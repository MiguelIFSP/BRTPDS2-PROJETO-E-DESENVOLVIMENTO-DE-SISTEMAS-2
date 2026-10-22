import { describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useListaPresencaPreview } from '@/hooks/useListaPresencaPreview';
import { createListaPresencaMock } from '@/mocks/listaPresencaMock';
import type { MarcacaoPresenca } from '@/utils/marcacoesPresenca';

describe('useListaPresencaPreview', () => {
  it('inicia com exemplos parcial e final e os totais consistentes', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());

    expect(result.current.versoes.map((lista) => lista.status)).toEqual([
      'FINAL',
      'PARCIAL',
    ]);
    for (const lista of result.current.versoes) {
      const { totais } = lista.snapshot;
      expect(
        totais.presentes +
          totais.atrasados +
          totais.sairamAntes +
          totais.ausentes,
      ).toBe(totais.aceitos);
      expect(lista.snapshot.membros).toHaveLength(
        totais.aceitos + totais.semResposta,
      );
    }
  });

  it('gera versões consecutivas e mantém observações no snapshot escolhido', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());

    await act(() => {
      result.current.generateVersion({ observacoes: 'Primeira simulação.' });
      result.current.generateVersion({ observacoes: 'Segunda simulação.' });
    });

    expect(result.current.versoes.map((lista) => lista.versao)).toEqual([
      4, 3, 2, 1,
    ]);
    expect(result.current.selectedLista?.observacoes).toBe(
      'Segunda simulação.',
    );

    await act(() => result.current.selectVersion(3));
    expect(result.current.selectedLista?.observacoes).toBe(
      'Primeira simulação.',
    );

    await act(() => result.current.selectVersion(1));
    expect(result.current.selectedLista?.status).toBe('PARCIAL');
  });

  it('restaura exemplos ao reiniciar sem conservar versões em armazenamento', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    await act(() =>
      result.current.generateVersion({ observacoes: 'Temporária.' }),
    );
    await act(() => {
      const listaInicial = result.current.resetPreview();
      expect(listaInicial?.versao).toBe(2);
      expect(listaInicial?.observacoes).toBe(
        'Exemplo de versão final após o término da reunião.',
      );
    });

    expect(result.current.versoes).toHaveLength(2);
    expect(result.current.selectedLista?.versao).toBe(2);
    expect(
      result.current.versoes.some(
        (lista) => lista.observacoes === 'Temporária.',
      ),
    ).toBe(false);
  });

  it('não altera o histórico ao receber seleção inexistente', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    await act(() => result.current.selectVersion(999));
    expect(result.current.selectedLista?.versao).toBe(2);
  });

  it('revisa a lista parcial selecionada sem reescrever seus registros de origem', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    await act(() => result.current.selectVersion(1));
    const origem = result.current.selectedLista;
    if (!origem) throw new Error('Versão parcial de teste ausente.');

    await act(() =>
      result.current.generateVersion({
        presencas: [
          { usuarioId: 1, status: 'AUSENTE', observacao: 'Correção manual.' },
        ],
        observacoes: 'Conferência durante a reunião.',
      }),
    );

    const revisada = result.current.selectedLista;
    expect(revisada?.versao).toBe(3);
    expect(revisada?.status).toBe('PARCIAL');
    expect(revisada?.geradoEm).toBe(origem.geradoEm);
    expect(revisada?.observacoes).toBe('Conferência durante a reunião.');
    expect(revisada?.snapshot).toEqual(origem.snapshot);
    expect(revisada?.snapshot).not.toBe(origem.snapshot);
    expect(revisada?.snapshot.membros[0]).not.toBe(origem.snapshot.membros[0]);
    expect(revisada?.snapshot.totais).not.toBe(origem.snapshot.totais);
    expect(revisada?.marcacoes).toEqual([
      { usuarioId: 1, status: 'AUSENTE', observacao: 'Correção manual.' },
    ]);
    expect(origem.snapshot.membros[0].status).toBe('PRESENTE');
    expect(origem.snapshot.membros[0].saidaPendente).toBe(true);
    expect(origem.marcacoes).toBeUndefined();
    expect(result.current.versoes.find((lista) => lista.id === origem.id)).toBe(
      origem,
    );
  });

  it('preserva marcações e observações da revisão anterior ao revisar outra pessoa', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    const presencas: MarcacaoPresenca[] = [
      { usuarioId: 1, status: 'AUSENTE', observacao: 'Ausência justificada.' },
    ];
    await act(() => result.current.generateVersion({ presencas }));
    const anterior = result.current.selectedLista;
    if (!anterior) throw new Error('Revisão anterior de teste ausente.');

    await act(() =>
      result.current.generateVersion({
        presencas: [{ usuarioId: 2, status: 'PRESENTE' }],
      }),
    );

    expect(result.current.selectedLista?.marcacoes).toEqual([
      { usuarioId: 1, status: 'AUSENTE', observacao: 'Ausência justificada.' },
      { usuarioId: 2, status: 'PRESENTE' },
    ]);
    expect(result.current.selectedLista?.snapshot).toEqual(anterior.snapshot);
    expect(anterior.marcacoes).toEqual([
      { usuarioId: 1, status: 'AUSENTE', observacao: 'Ausência justificada.' },
    ]);
    expect(anterior.marcacoes?.[0]).not.toBe(presencas[0]);
    expect(result.current.selectedLista?.marcacoes?.[0]).not.toBe(
      anterior.marcacoes?.[0],
    );
  });

  it('preserva a observação geral quando uma revisão só altera presenças', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    await act(() =>
      result.current.generateVersion({
        presencas: [{ usuarioId: 1, status: 'AUSENTE' }],
        observacoes: 'Observação da lista revisada.',
      }),
    );
    const anterior = result.current.selectedLista;
    if (!anterior) throw new Error('Revisão anterior de teste ausente.');

    await act(() =>
      result.current.generateVersion({
        presencas: [{ usuarioId: 2, status: 'PRESENTE' }],
      }),
    );

    expect(result.current.selectedLista?.observacoes).toBe(
      'Observação da lista revisada.',
    );
    expect(result.current.selectedLista?.snapshot).toEqual(anterior.snapshot);
    expect(result.current.selectedLista?.snapshot).not.toBe(anterior.snapshot);
    expect(anterior.observacoes).toBe('Observação da lista revisada.');
    expect(anterior.marcacoes).toEqual([{ usuarioId: 1, status: 'AUSENTE' }]);
  });

  it('permite limpar ou substituir explicitamente a observação sem mudar o histórico', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    const origem = result.current.selectedLista;
    if (!origem) throw new Error('Versão inicial de teste ausente.');

    await act(() =>
      result.current.generateVersion({ presencas: [], observacoes: '' }),
    );
    const limpa = result.current.selectedLista;
    expect(limpa?.observacoes).toBeNull();
    expect(limpa?.snapshot).toEqual(origem.snapshot);
    expect(origem.observacoes).toBe(
      'Exemplo de versão final após o término da reunião.',
    );

    await act(() =>
      result.current.generateVersion({
        presencas: [],
        observacoes: '  Observação substituída.  ',
      }),
    );

    expect(result.current.selectedLista?.observacoes).toBe(
      'Observação substituída.',
    );
    expect(result.current.selectedLista?.snapshot).toEqual(origem.snapshot);
    expect(limpa?.observacoes).toBeNull();
  });

  it('usa a versão escolhida como base em vez das marcações da versão mais recente', async () => {
    const { result } = await renderHook(() => useListaPresencaPreview());
    await act(() =>
      result.current.generateVersion({
        presencas: [{ usuarioId: 1, status: 'AUSENTE' }],
      }),
    );
    await act(() => result.current.selectVersion(2));
    await act(() =>
      result.current.generateVersion({
        presencas: [{ usuarioId: 2, status: 'PRESENTE' }],
      }),
    );

    expect(result.current.selectedLista?.marcacoes).toEqual([
      { usuarioId: 2, status: 'PRESENTE' },
    ]);
    expect(
      result.current.versoes.find((lista) => lista.id === 3)?.marcacoes,
    ).toEqual([{ usuarioId: 1, status: 'AUSENTE' }]);
  });

  it('cria cópias independentes dos exemplos para não modificar outra visita', () => {
    const primeira = createListaPresencaMock();
    const segunda = createListaPresencaMock();
    primeira[0].snapshot.cabecalho.reuniao.titulo = 'Alteração local de teste';
    primeira[0].snapshot.membros[0].nome = 'Pessoa alterada';

    expect(segunda[0].snapshot.cabecalho.reuniao.titulo).toBe(
      'Planejamento da equipe — demonstração',
    );
    expect(segunda[0].snapshot.membros[0].nome).toBe('Ana Exemplo');
  });
});
