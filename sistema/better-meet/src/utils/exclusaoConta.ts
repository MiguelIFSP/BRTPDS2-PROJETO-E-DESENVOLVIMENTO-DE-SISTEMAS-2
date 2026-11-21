import { ApiError } from '@/utils/apiClient';

type Pendente = { nome?: unknown };

type DetalhesExclusao = {
  organizacoesPendentes?: Pendente[];
  comissoesPendentes?: Pendente[];
};

export const AVISO_AUTORIA =
  'Reuniões e votações que você criou continuarão existindo, como criadas por "usuário removido".';

const nomes = (pendentes: Pendente[] | undefined) =>
  (pendentes ?? [])
    .map((item) => (typeof item.nome === 'string' ? item.nome : null))
    .filter((nome): nome is string => nome !== null);

/**
 * Mensagem do 409 da exclusão de conta: lista quem ainda precisa assumir cada
 * organização e comissão. Sem `details` ou sem pendência, devolve null e a tela
 * mostra a mensagem da própria API.
 */
export const mensagemExclusaoPendente = (error: unknown): string | null => {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const body = error.body;
  if (typeof body !== 'object' || body === null) return null;
  const detalhes = body as DetalhesExclusao;
  const lista = [
    ...nomes(detalhes.organizacoesPendentes),
    ...nomes(detalhes.comissoesPendentes),
  ];
  if (lista.length === 0) return null;
  return `Escolha quem assume ${lista.join(', ')} antes de excluir a conta.`;
};
