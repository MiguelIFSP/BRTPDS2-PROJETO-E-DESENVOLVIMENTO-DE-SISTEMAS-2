// Mesmo algoritmo de `instanteNoFuso` da API (api/src/utils/fusoHorario.ts):
// data e hora das reuniões não têm fuso, e a regra de "passado" vale no fuso
// da reunião, não no do aparelho.
export const TZ_REUNIOES = 'America/Sao_Paulo';

const MINUTO_MS = 60_000;

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

const deslocamento = (instante: Date, fuso: string) =>
  partesNoFuso(instante, fuso) - Math.floor(instante.getTime() / 1000) * 1000;

/** Instante (UTC) em que "data hora" acontece no fuso. */
export const instanteNoFuso = (
  data: string,
  hora: string,
  fuso: string = TZ_REUNIOES,
) => {
  const [ano = 0, mes = 1, dia = 1] = data.split('-').map(Number);
  const [horas = 0, minutos = 0] = hora.split(':').map(Number);
  const comoUtc = Date.UTC(ano, mes - 1, dia, horas, minutos);
  // Duas passadas acertam também os dias de troca de horário de verão.
  let instante = comoUtc - deslocamento(new Date(comoUtc), fuso);
  instante = comoUtc - deslocamento(new Date(instante), fuso);
  return new Date(instante);
};

/** Data "AAAA-MM-DD" que o instante tem no fuso. */
export const dataNoFuso = (instante: Date, fuso: string = TZ_REUNIOES) =>
  new Date(partesNoFuso(instante, fuso)).toISOString().slice(0, 10);

/** O minuto atual ainda vale: só um horário anterior a ele é passado. */
export const horarioNoPassado = (
  data: string,
  hora: string,
  fuso: string = TZ_REUNIOES,
  agora = new Date(),
) => {
  const inicioDoMinuto = new Date(
    Math.floor(agora.getTime() / MINUTO_MS) * MINUTO_MS,
  );
  return instanteNoFuso(data, hora, fuso) < inicioDoMinuto;
};

/** Hoje no fuso da reunião, como data local à meia-noite (para o seletor). */
export const hojeNoFusoComoDataLocal = (agora = new Date()) => {
  const [ano = 0, mes = 1, dia = 1] = dataNoFuso(agora).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
};
