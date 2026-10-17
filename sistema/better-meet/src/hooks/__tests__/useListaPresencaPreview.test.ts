import { describe, expect, it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useListaPresencaPreview } from '@/hooks/useListaPresencaPreview';
import { createListaPresencaMock } from '@/mocks/listaPresencaMock';

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
    await act(() => result.current.resetPreview());

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
