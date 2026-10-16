import type { ReactNode } from 'react';

import Badge from '@/components/ui/Badge';
import ExpandableCard from '@/components/ui/ExpandableCard';
import { STATUS_ORGANIZACAO_UI } from '@/constants/status';
import type { Organizacao } from '@/services/organizacaoService';
import { countLabel } from '@/utils/format';

type OrganizacaoCardProps = {
  organizacao: Organizacao;
  expanded: boolean;
  onToggle: () => void;
  // conteúdo mostrado com o card aberto (equipe, ações).
  children: ReactNode;
};

export default function OrganizacaoCard({
  organizacao,
  expanded,
  onToggle,
  children,
}: OrganizacaoCardProps) {
  const status = STATUS_ORGANIZACAO_UI[organizacao.status];

  return (
    <ExpandableCard
      icon="business-outline"
      title={organizacao.nome}
      meta={`${countLabel(organizacao.membros.length, 'membro', 'membros')} · ${countLabel(organizacao.comissoes.length, 'comissão', 'comissões')}`}
      memberNames={organizacao.membros.map((membro) => membro.user.name)}
      trailing={<Badge label={status.label} tone={status.tone} showDot />}
      expanded={expanded}
      onToggle={onToggle}
    >
      {children}
    </ExpandableCard>
  );
}
