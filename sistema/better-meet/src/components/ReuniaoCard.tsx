import SummaryCard from '@/components/ui/SummaryCard';
import type {
  ReuniaoParticipante,
  ReuniaoRegistro,
  StatusConviteReuniao,
  StatusReuniao,
} from '@/services/reuniaoService';
import { formatReuniaoDate } from '@/utils/format';

export type ReuniaoCardData = {
  id: number;
  titulo: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  pauta: string;
  descricao?: string;
  local?: string;
  comissaoId: number;
  criadoPorUserId: number;
  status: StatusReuniao;
  meuRegistro?: ReuniaoRegistro | null;
  participantes?: ReuniaoParticipante[];
  convites?: {
    id: number;
    userId: number;
    nome: string;
    status: StatusConviteReuniao;
  }[];
  comissaoNome?: string;
};

type ReuniaoCardProps = {
  reuniao: ReuniaoCardData;
  onPress: () => void;
};

// Resumo na lista. Pauta, descrição, participantes, presença e lista de
// presença ficam na tela da reunião, aberta pelo toque.
export default function ReuniaoCard({ reuniao, onPress }: ReuniaoCardProps) {
  const quando = `${formatReuniaoDate(reuniao.data)} · ${reuniao.horaInicio} às ${reuniao.horaFim}`;

  return (
    <SummaryCard
      icon="calendar-outline"
      title={reuniao.titulo}
      description={
        reuniao.comissaoNome ? `Comissão: ${reuniao.comissaoNome}` : null
      }
      meta={reuniao.local ? `${quando}\n${reuniao.local}` : quando}
      memberNames={[]}
      onPress={onPress}
    />
  );
}
