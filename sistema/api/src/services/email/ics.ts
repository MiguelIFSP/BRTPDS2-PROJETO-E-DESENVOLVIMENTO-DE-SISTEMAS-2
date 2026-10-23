// Gera o .ics (iCalendar, RFC 5545) anexado aos e-mails. O UID é fixo por
// reunião: o convite cria o evento no calendário do convidado, e os e-mails
// seguintes (REQUEST com SEQUENCE maior ou CANCEL) atualizam ou removem esse
// mesmo evento. Os horários vão em UTC, o que dispensa o bloco VTIMEZONE.

export type MetodoIcs = 'REQUEST' | 'CANCEL';

export type EventoIcs = {
  reuniaoId: number;
  titulo: string;
  descricao: string;
  local: string | null;
  inicio: Date;
  fim: Date;
  organizador: { nome: string; email: string };
  participante: { nome: string; email: string };
};

const formatarUtc = (instante: Date) =>
  instante
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

// Texto de propriedade: \, ; e , escapados e quebras de linha como \n.
const escapar = (texto: string) =>
  texto
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

// Parâmetro (CN): sem aspas, e entre aspas se tiver : ; ou ,.
const parametro = (texto: string) => {
  const limpo = texto.replace(/"/g, "'");
  return /[:;,]/.test(limpo) ? `"${limpo}"` : limpo;
};

// Linhas de no máximo 75 bytes; a continuação começa com um espaço.
const dobrar = (linha: string) => {
  const partes: string[] = [];
  let atual = '';
  for (const caractere of linha) {
    const limite = partes.length === 0 ? 75 : 74;
    if (Buffer.byteLength(atual + caractere) > limite) {
      partes.push(atual);
      atual = caractere;
    } else {
      atual += caractere;
    }
  }
  partes.push(atual);
  return partes.join('\r\n ');
};

export const uidDaReuniao = (reuniaoId: number) =>
  `reuniao-${reuniaoId}@better-meet`;

export const gerarIcs = (
  metodo: MetodoIcs,
  evento: EventoIcs,
  agora = new Date(),
) => {
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Better Meet//Reunioes//PT-BR',
    'CALSCALE:GREGORIAN',
    `METHOD:${metodo}`,
    'BEGIN:VEVENT',
    `UID:${uidDaReuniao(evento.reuniaoId)}`,
    // Cresce a cada envio (segundos desde 1970), para o calendário aceitar a
    // versão nova do mesmo evento sem um contador no banco.
    `SEQUENCE:${Math.floor(agora.getTime() / 1000)}`,
    `DTSTAMP:${formatarUtc(agora)}`,
    `DTSTART:${formatarUtc(evento.inicio)}`,
    `DTEND:${formatarUtc(evento.fim)}`,
    `SUMMARY:${escapar(evento.titulo)}`,
    ...(evento.local ? [`LOCATION:${escapar(evento.local)}`] : []),
    `DESCRIPTION:${escapar(evento.descricao)}`,
    `ORGANIZER;CN=${parametro(evento.organizador.nome)}:mailto:${evento.organizador.email}`,
    // RSVP=FALSE: a resposta vale no app, não por e-mail ao remetente.
    `ATTENDEE;CN=${parametro(evento.participante.nome)};ROLE=REQ-PARTICIPANT;RSVP=FALSE:mailto:${evento.participante.email}`,
    `STATUS:${metodo === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return linhas.map(dobrar).join('\r\n') + '\r\n';
};
