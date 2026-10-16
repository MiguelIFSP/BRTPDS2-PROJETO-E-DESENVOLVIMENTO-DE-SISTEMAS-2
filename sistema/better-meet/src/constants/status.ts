import type { BadgeTone } from '@/components/ui/Badge';
import type { StatusOrganizacao } from '@/services/organizacaoService';

// Rótulo e cor de cada status de organização, usado nas telas de organização e
// nos relatórios.
export const STATUS_ORGANIZACAO_UI = {
  ACEITA: { label: 'Ativa', tone: 'success' },
  PENDENTE: { label: 'Aguardando aprovação', tone: 'warning' },
  RECUSADA: { label: 'Recusada', tone: 'danger' },
} as const satisfies Record<
  StatusOrganizacao,
  { label: string; tone: BadgeTone }
>;
