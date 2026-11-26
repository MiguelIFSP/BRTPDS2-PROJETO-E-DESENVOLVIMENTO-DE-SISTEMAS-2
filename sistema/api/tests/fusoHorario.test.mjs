import { describe, expect, test } from '@jest/globals';

import {
  estadoDaReuniao,
  formatarHoraNoFuso,
  horarioNoPassado,
  podeMudarRespostaConvite,
  podeRegistrarEntrada,
  podeRegistrarSaida,
} from '../src/utils/fusoHorario.ts';

const SP = 'America/Sao_Paulo';
// 10:00 às 11:00 em São Paulo (UTC-3): abre 12:45Z, início 13:00Z, fim 14:00Z,
// limite de saída 14:30Z.
const reuniao = {
  data: '2026-10-21',
  horaInicio: '10:00',
  horaFim: '11:00',
  status: 'AGENDADA',
};
const em = (texto) => new Date(texto);
const estadoEm = (texto, dados = reuniao) =>
  estadoDaReuniao(dados, SP, em(texto)).estado;

describe('estadoDaReuniao', () => {
  test.each([
    ['2026-10-21T12:44:59Z', 'AGUARDANDO'],
    ['2026-10-21T12:45:00Z', 'AGUARDANDO'],
    ['2026-10-21T12:59:59Z', 'AGUARDANDO'],
    ['2026-10-21T13:00:00Z', 'EM_ANDAMENTO'],
    ['2026-10-21T13:59:59Z', 'EM_ANDAMENTO'],
    ['2026-10-21T14:00:00Z', 'ENCERRADA'],
  ])('em %s o estado é %s', (instante, esperado) => {
    expect(estadoEm(instante)).toBe(esperado);
  });

  test('reunião cancelada precede qualquer horário', () => {
    expect(
      estadoEm('2026-10-21T13:30:00Z', { ...reuniao, status: 'CANCELADA' }),
    ).toBe('CANCELADA');
  });

  test('devolve os pontos de tempo calculados no fuso', () => {
    const estado = estadoDaReuniao(reuniao, SP, em('2026-10-21T13:30:00Z'));
    expect(estado.aberturaCheckIn.toISOString()).toBe(
      '2026-10-21T13:00:00.000Z',
    );
    expect(estado.inicio.toISOString()).toBe('2026-10-21T13:00:00.000Z');
    expect(estado.fim.toISOString()).toBe('2026-10-21T14:00:00.000Z');
    expect(estado.limiteSaida.toISOString()).toBe('2026-10-21T14:30:00.000Z');
  });

  test('reunião às 23:30 do fuso não vira o dia seguinte em UTC', () => {
    const noite = {
      data: '2026-10-21',
      horaInicio: '23:30',
      horaFim: '23:59',
      status: 'AGENDADA',
    };
    // 23:30 em São Paulo = 02:30Z do dia 22.
    expect(estadoEm('2026-10-22T02:29:59Z', noite)).toBe('AGUARDANDO');
    expect(estadoEm('2026-10-22T02:30:00Z', noite)).toBe('EM_ANDAMENTO');
    expect(estadoEm('2026-10-22T02:59:00Z', noite)).toBe('ENCERRADA');
  });

  test('o fuso configurado decide, não o do processo', () => {
    const emUtc = estadoDaReuniao(reuniao, 'UTC', em('2026-10-21T10:30:00Z'));
    expect(emUtc.estado).toBe('EM_ANDAMENTO');
  });
});

describe('janelas', () => {
  test('entrada: aberta de 13:00:00Z até 13:59:59Z', () => {
    expect(podeRegistrarEntrada(reuniao, SP, em('2026-10-21T12:44:59Z'))).toBe(
      false,
    );
    expect(podeRegistrarEntrada(reuniao, SP, em('2026-10-21T13:00:00Z'))).toBe(
      true,
    );
    expect(podeRegistrarEntrada(reuniao, SP, em('2026-10-21T13:59:59Z'))).toBe(
      true,
    );
    expect(podeRegistrarEntrada(reuniao, SP, em('2026-10-21T14:00:00Z'))).toBe(
      false,
    );
  });

  test('saída: aberta até 14:29:59Z', () => {
    expect(podeRegistrarSaida(reuniao, SP, em('2026-10-21T12:44:59Z'))).toBe(
      false,
    );
    expect(podeRegistrarSaida(reuniao, SP, em('2026-10-21T14:29:59Z'))).toBe(
      true,
    );
    expect(podeRegistrarSaida(reuniao, SP, em('2026-10-21T14:30:00Z'))).toBe(
      false,
    );
  });

  test('resposta do convite só muda antes do início', () => {
    expect(
      podeMudarRespostaConvite(reuniao, SP, em('2026-10-21T12:59:59Z')),
    ).toBe(true);
    expect(
      podeMudarRespostaConvite(reuniao, SP, em('2026-10-21T13:00:00Z')),
    ).toBe(false);
  });
});

describe('horarioNoPassado', () => {
  test('o minuto atual ainda vale', () => {
    const agora = em('2026-10-21T13:00:45Z');
    expect(horarioNoPassado('2026-10-21', '10:00', SP, agora)).toBe(false);
    expect(horarioNoPassado('2026-10-21', '09:59', SP, agora)).toBe(true);
  });

  test('noite no fuso não é passado só porque o dia UTC virou', () => {
    // 22/10 01:00Z = 21/10 22:00 em São Paulo.
    const agora = em('2026-10-22T01:00:00Z');
    expect(horarioNoPassado('2026-10-21', '23:00', SP, agora)).toBe(false);
    expect(horarioNoPassado('2026-10-21', '21:00', SP, agora)).toBe(true);
  });
});

test('formatarHoraNoFuso usa o fuso informado', () => {
  expect(formatarHoraNoFuso(em('2026-10-21T12:45:00Z'), SP)).toBe('09:45');
});
