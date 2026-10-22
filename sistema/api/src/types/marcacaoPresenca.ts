import type { StatusMembroListaPresenca } from './listaPresenca.ts';

export const STATUS_MARCACAO_PRESENCA = [
  'PRESENTE',
  'ATRASADO',
  'SAIU_ANTES',
  'AUSENTE',
  'SEM_RESPOSTA',
] as const satisfies readonly StatusMembroListaPresenca[];

/** Marcação manual independente dos convites e registros de participação. */
export type MarcacaoPresenca = {
  usuarioId: number;
  status: StatusMembroListaPresenca;
  observacao?: string;
};
