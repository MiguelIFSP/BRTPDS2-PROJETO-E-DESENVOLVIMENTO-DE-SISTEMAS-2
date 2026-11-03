import { useCallback, useState } from 'react';

import {
  createListaPresencaMock,
  createListaPresencaMockVersion,
} from '@/mocks/listaPresencaMock';
import type { GerarListaPresencaData } from '@/services/listaPresencaService';
import { mergeMarcacoesPresenca } from '@/utils/marcacoesPresenca';

const createPreviewState = () => {
  const versoes = createListaPresencaMock();
  return { versoes, selectedId: versoes[0]?.id ?? null };
};

/**
 * Mantém a demonstração somente em memória. A futura integração deve trocar
 * estas fontes pelo service HTTP sem criar reuniões ou convites nesta tela.
 */
export function useListaPresencaPreview() {
  const [state, setState] = useState(createPreviewState);

  // A função estável permite restaurar os exemplos no useFocusEffect da tela.
  const resetPreview = useCallback(() => {
    const initialState = createPreviewState();
    setState(initialState);
    return initialState.versoes.find(
      (lista) => lista.id === initialState.selectedId,
    );
  }, []);

  const selectVersion = (id: number) => {
    setState((current) =>
      current.versoes.some((versao) => versao.id === id)
        ? { ...current, selectedId: id }
        : current,
    );
  };

  const generateVersion = (data: GerarListaPresencaData) => {
    setState((current) => {
      const versao = (current.versoes[0]?.versao ?? 0) + 1;
      const lista = createListaPresencaMockVersion(versao, data);
      const origem = current.versoes.find(
        (item) => item.id === current.selectedId,
      );
      if (data.presencas && origem) {
        // A revisão copia a versão selecionada e mantém intactos os registros observados.
        lista.snapshot = {
          ...origem.snapshot,
          cabecalho: {
            reuniao: { ...origem.snapshot.cabecalho.reuniao },
            organizacao: { ...origem.snapshot.cabecalho.organizacao },
            comissao: { ...origem.snapshot.cabecalho.comissao },
          },
          membros: origem.snapshot.membros.map((membro) => ({ ...membro })),
          totais: { ...origem.snapshot.totais },
        };
        lista.status = origem.status;
        lista.observacoes =
          data.observacoes === undefined
            ? origem.observacoes
            : data.observacoes.trim() || null;
        if (origem.status === 'PARCIAL') lista.geradoEm = origem.geradoEm;
        lista.marcacoes = mergeMarcacoesPresenca(
          origem.snapshot.membros,
          origem.marcacoes ?? [],
          data.presencas,
        );
      }
      return { versoes: [lista, ...current.versoes], selectedId: lista.id };
    });
  };

  return {
    versoes: state.versoes,
    selectedId: state.selectedId,
    selectedLista: state.versoes.find((lista) => lista.id === state.selectedId),
    generateVersion,
    selectVersion,
    resetPreview,
  };
}
