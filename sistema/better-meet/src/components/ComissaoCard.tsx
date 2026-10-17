import SummaryCard from '@/components/ui/SummaryCard';
import type { Comissao } from '@/services/comissaoService';
import type { OrganizacaoMembro } from '@/services/organizacaoService';
import { countLabel } from '@/utils/format';

type ComissaoCardProps = {
  comissao: Comissao;
  // a listagem só traz o id de cada membro; o nome vem da organização.
  membrosOrganizacao: OrganizacaoMembro[];
  onPress: () => void;
};

export default function ComissaoCard({
  comissao,
  membrosOrganizacao,
  onPress,
}: ComissaoCardProps) {
  const nomePorUserId = new Map(
    membrosOrganizacao.map((membro) => [membro.user.id, membro.user.name]),
  );
  const nomes = comissao.equipe.map(
    (membro) => nomePorUserId.get(membro.userId) ?? '?',
  );

  return (
    <SummaryCard
      icon="people-outline"
      title={comissao.nome}
      description={comissao.descricao}
      meta={countLabel(nomes.length, 'membro', 'membros')}
      memberNames={nomes}
      onPress={onPress}
    />
  );
}
