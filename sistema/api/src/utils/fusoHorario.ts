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
