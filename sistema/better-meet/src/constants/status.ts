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

// Nome da tela de status do sistema (menu Mais e cabeçalho da tela): o
// administrador também pode iniciar/parar/reiniciar os subsistemas nela.
export const statusScreenTitle = (isAdmin: boolean) =>
  isAdmin ? 'Status e reset do sistema' : 'Status do Sistema';
