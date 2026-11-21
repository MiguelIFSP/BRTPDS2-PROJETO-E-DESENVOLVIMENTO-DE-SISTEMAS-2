import { describe, expect, it } from '@jest/globals';

import { calcularJanelaCheckIn } from '@/utils/janelaCheckIn';

// 10:00 a 11:00 em São Paulo = 13:00 a 14:00 UTC.
const reuniao = { data: '2026-06-15', horaInicio: '10:00', horaFim: '11:00' };
const em = (iso: string) => calcularJanelaCheckIn(reuniao, new Date(iso));

describe('calcularJanelaCheckIn', () => {
  it('abre 15 minutos antes do início e fecha no fim', () => {
    const janela = em('2026-06-15T12:00:00Z');
    expect(janela.abreEm.toISOString()).toBe('2026-06-15T12:45:00.000Z');
    expect(janela.fechaEm.toISOString()).toBe('2026-06-15T14:00:00.000Z');
  });

  it('1 segundo antes de abrir: antes', () => {
    expect(em('2026-06-15T12:44:59Z').estado).toBe('antes');
  });

  it('no instante de abertura: aberta', () => {
    expect(em('2026-06-15T12:45:00Z').estado).toBe('aberta');
  });

  it('1 segundo antes do fim: aberta', () => {
    expect(em('2026-06-15T13:59:59Z').estado).toBe('aberta');
  });

  it('no fim: depois', () => {
    expect(em('2026-06-15T14:00:00Z').estado).toBe('depois');
  });
});
