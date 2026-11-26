import { instanteNoFuso, TZ_REUNIOES } from '@/utils/fusoReuniao';

// Mesma margem da API (TOLERANCIA_ENTRADA_MIN). A decisão final é sempre da
// API; o app só reflete para não mostrar um botão que seria recusado.
export const TOLERANCIA_ENTRADA_MIN = 0;

export type EstadoJanelaCheckIn = 'antes' | 'aberta' | 'depois';

export type JanelaCheckIn = {
  abreEm: Date;
  fechaEm: Date;
  estado: EstadoJanelaCheckIn;
};

type ReuniaoComHorario = {
  data: string;
  horaInicio: string;
  horaFim: string;
};

/** A entrada abre no início e fecha no fim da reunião. */
export const calcularJanelaCheckIn = (
  reuniao: ReuniaoComHorario,
  agora = new Date(),
  fuso: string = TZ_REUNIOES,
): JanelaCheckIn => {
  const inicio = instanteNoFuso(reuniao.data, reuniao.horaInicio, fuso);
  const fechaEm = instanteNoFuso(reuniao.data, reuniao.horaFim, fuso);
  const abreEm = new Date(inicio.getTime() - TOLERANCIA_ENTRADA_MIN * 60_000);
  let estado: EstadoJanelaCheckIn = 'aberta';
  if (agora < abreEm) estado = 'antes';
  else if (agora >= fechaEm) estado = 'depois';
  return { abreEm, fechaEm, estado };
};

/** "HH:mm" do instante no fuso da reunião. */
export const formatarHoraDaReuniao = (
  instante: Date,
  fuso: string = TZ_REUNIOES,
) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante);
