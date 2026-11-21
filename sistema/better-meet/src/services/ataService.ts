import type { PapelComissao } from '@/services/comissaoService';
import { apiRequest } from '@/utils/apiClient';

export type StatusAtaVoto = 'APROVADO' | 'REPROVADO';
export type Ata = {
  reuniaoId: number;
  titulo: string;
  dataReuniao: string;
  conteudoAta: string | null;
  versaoAta: number;
  papelNaComissao: PapelComissao;
  podeEditar: boolean;
  podeVotar: boolean;
  meuVoto: StatusAtaVoto | null;
  // Aprovada = maioria simples dos presentes aprovou a versão atual.
  presentes: number;
  aprovada: boolean;
  // Depois de exportada a aprovação é definitiva: edição e voto são bloqueados.
  exportada: boolean;
  exportadaAt: string | null;
  podeExportar: boolean;
  votos: { aprovados: number; reprovados: number };
};

export const ataService = {
  getByReuniao(token: string, reuniaoId: number) {
    return apiRequest<Ata>(`/reunioes/${reuniaoId}/ata`, {
      token,
      fallbackError: 'Não foi possível carregar a ata.',
    });
  },
  save(
    token: string,
    reuniaoId: number,
    conteudoAta: string,
    versaoAta: number,
  ) {
    return apiRequest<Ata>(`/reunioes/${reuniaoId}/ata`, {
      method: 'PUT',
      token,
      body: { conteudoAta, versaoAta },
      fallbackError: 'Não foi possível salvar a ata.',
    });
  },
  // 409 se a ata ainda não foi aprovada pela maioria dos presentes.
  exportar(token: string, reuniaoId: number) {
    return apiRequest<Ata>(`/reunioes/${reuniaoId}/ata/exportar`, {
      method: 'POST',
      token,
      fallbackError: 'Não foi possível exportar a ata.',
    });
  },
  vote(
    token: string,
    reuniaoId: number,
    status: StatusAtaVoto,
    versaoAta: number,
  ) {
    return apiRequest<Ata>(`/reunioes/${reuniaoId}/ata/votar`, {
      method: 'POST',
      token,
      body: { status, versaoAta },
      fallbackError: 'Não foi possível registrar seu voto.',
    });
  },
};
