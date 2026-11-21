// Data e horário das reuniões ficam no banco como texto, sem fuso ("AAAA-MM-DD"
// e "HH:mm"). Estas funções os leem no fuso configurado (TZ_REUNIOES) usando
// só o Intl do Node, sem depender do fuso da máquina onde a API roda.

const MINUTO_MS = 60_000;

// Partes de calendário que o instante tem no fuso, como se fossem UTC.
const partesNoFuso = (instante: Date, fuso: string) => {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: fuso,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instante)
      .map((parte) => [parte.type, parte.value]),
  );
  return Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    Number(partes.hour),
    Number(partes.minute),
    Number(partes.second),
  );
};

// Diferença (ms) entre o relógio do fuso e o UTC naquele instante.
const deslocamento = (instante: Date, fuso: string) =>
  partesNoFuso(instante, fuso) - Math.floor(instante.getTime() / 1000) * 1000;

/** Instante (UTC) em que "data hora" acontece no fuso. */
export const instanteNoFuso = (data: string, hora: string, fuso: string) => {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [horas, minutos] = hora.split(':').map(Number);
  const comoUtc = Date.UTC(ano!, mes! - 1, dia!, horas!, minutos!);
  // Duas passadas acertam também os dias de troca de horário de verão.
  let instante = comoUtc - deslocamento(new Date(comoUtc), fuso);
  instante = comoUtc - deslocamento(new Date(instante), fuso);
  return new Date(instante);
};

/** Data "AAAA-MM-DD" que o instante tem no fuso. */
export const dataNoFuso = (instante: Date, fuso: string) =>
  new Date(partesNoFuso(instante, fuso)).toISOString().slice(0, 10);

export const addMinutes = (instante: Date, minutos: number) =>
  new Date(instante.getTime() + minutos * MINUTO_MS);

// Janelas de presença, em minutos: a entrada abre antes do início e a saída
// ainda vale um tempo depois do fim.
export const TOLERANCIA_ENTRADA_MIN = 15;
export const TOLERANCIA_SAIDA_MIN = 30;

export type EstadoReuniao =
  'CANCELADA' | 'AGUARDANDO' | 'CHECKIN_ABERTO' | 'EM_ANDAMENTO' | 'ENCERRADA';

export type ReuniaoComHorario = {
  data: string;
  horaInicio: string;
  horaFim: string;
  status: string;
};

export type EstadoDaReuniao = {
  estado: EstadoReuniao;
  inicio: Date;
  fim: Date;
  aberturaCheckIn: Date;
  limiteSaida: Date;
};

/**
 * Única fonte do estado de uma reunião por horário. A API impede que o término
 * cruze a meia-noite, então fim e início ficam sempre no mesmo dia.
 */
export const estadoDaReuniao = (
  reuniao: ReuniaoComHorario,
  fuso: string,
  agora = new Date(),
): EstadoDaReuniao => {
  const inicio = instanteNoFuso(reuniao.data, reuniao.horaInicio, fuso);
  const fim = instanteNoFuso(reuniao.data, reuniao.horaFim, fuso);
  const aberturaCheckIn = addMinutes(inicio, -TOLERANCIA_ENTRADA_MIN);
  const limiteSaida = addMinutes(fim, TOLERANCIA_SAIDA_MIN);

  let estado: EstadoReuniao;
  if (reuniao.status === 'CANCELADA') estado = 'CANCELADA';
  else if (agora < aberturaCheckIn) estado = 'AGUARDANDO';
  else if (agora < inicio) estado = 'CHECKIN_ABERTO';
  else if (agora < fim) estado = 'EM_ANDAMENTO';
  else estado = 'ENCERRADA';

  return { estado, inicio, fim, aberturaCheckIn, limiteSaida };
};

export const podeRegistrarEntrada = (
  reuniao: ReuniaoComHorario,
  fuso: string,
  agora = new Date(),
) => {
  const { estado } = estadoDaReuniao(reuniao, fuso, agora);
  return estado === 'CHECKIN_ABERTO' || estado === 'EM_ANDAMENTO';
};

export const podeRegistrarSaida = (
  reuniao: ReuniaoComHorario,
  fuso: string,
  agora = new Date(),
) => {
  const { estado, aberturaCheckIn, limiteSaida } = estadoDaReuniao(
    reuniao,
    fuso,
    agora,
  );
  return (
    estado !== 'CANCELADA' && agora >= aberturaCheckIn && agora < limiteSaida
  );
};

export const podeMudarRespostaConvite = (
  reuniao: ReuniaoComHorario,
  fuso: string,
  agora = new Date(),
) => {
  const { estado, inicio } = estadoDaReuniao(reuniao, fuso, agora);
  return estado !== 'CANCELADA' && agora < inicio;
};

/** O minuto atual ainda vale: só um horário anterior a ele é passado. */
export const horarioNoPassado = (
  data: string,
  hora: string,
  fuso: string,
  agora = new Date(),
) => {
  const inicioDoMinuto = new Date(
    Math.floor(agora.getTime() / MINUTO_MS) * MINUTO_MS,
  );
  return instanteNoFuso(data, hora, fuso) < inicioDoMinuto;
};

/** Hora "HH:mm" que o instante tem no fuso. */
export const formatarHoraNoFuso = (instante: Date, fuso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante);

/** Data "DD/MM/AAAA" que o instante tem no fuso. */
export const formatarDataNoFuso = (instante: Date, fuso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: fuso,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(instante);
