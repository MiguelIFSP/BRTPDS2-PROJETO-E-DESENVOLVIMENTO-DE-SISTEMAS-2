import type { ReactNode } from 'react';

import Badge from '@/components/ui/Badge';
import SummaryCard from '@/components/ui/SummaryCard';
import { STATUS_ORGANIZACAO_UI } from '@/constants/status';
import type { Organizacao } from '@/services/organizacaoService';
import { countLabel } from '@/utils/format';

type OrganizacaoCardProps = {
  organizacao: Organizacao;
  onPress: () => void;
  // conteúdo fixo abaixo do resumo (ex.: aceitar/recusar do admin).
  children?: ReactNode;
};

export default function OrganizacaoCard({
  organizacao,
  onPress,
  children,
}: OrganizacaoCardProps) {
  const status = STATUS_ORGANIZACAO_UI[organizacao.status];

  return (
    <SummaryCard
      icon="business-outline"
      title={organizacao.nome}
      meta={`${countLabel(organizacao.membros.length, 'membro', 'membros')} · ${countLabel(organizacao.comissoes.length, 'comissão', 'comissões')}`}
      memberNames={organizacao.membros.map((membro) => membro.user.name)}
      trailing={<Badge label={status.label} tone={status.tone} showDot />}
      onPress={onPress}
    >
      {children}
    </SummaryCard>
  );
}
