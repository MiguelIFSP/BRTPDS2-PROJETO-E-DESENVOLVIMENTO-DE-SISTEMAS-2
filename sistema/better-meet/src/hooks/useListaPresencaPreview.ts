import { useCallback, useState } from 'react';

import {
  createListaPresencaMock,
  createListaPresencaMockVersion,
} from '@/mocks/listaPresencaMock';
import type { GerarListaPresencaData } from '@/services/listaPresencaService';

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
  const resetPreview = useCallback(() => setState(createPreviewState()), []);

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
