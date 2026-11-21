import { describe, expect, it } from '@jest/globals';

import {
  dataNoFuso,
  horarioNoPassado,
  hojeNoFusoComoDataLocal,
  instanteNoFuso,
  TZ_REUNIOES,
} from '@/utils/fusoReuniao';

describe('fusoReuniao', () => {
  it('converte data e hora de São Paulo (UTC-3) para o instante UTC', () => {
    expect(
      instanteNoFuso('2026-06-15', '10:00', TZ_REUNIOES).toISOString(),
    ).toBe('2026-06-15T13:00:00.000Z');
  });

  it('vira o dia quando o horário local passa de 21h', () => {
    expect(instanteNoFuso('2026-06-15', '22:30').toISOString()).toBe(
      '2026-06-16T01:30:00.000Z',
    );
  });

  it('usa o fuso informado', () => {
    expect(
      instanteNoFuso('2026-01-10', '08:00', 'Asia/Tokyo').toISOString(),
    ).toBe('2026-01-09T23:00:00.000Z');
  });

  it('dataNoFuso devolve o dia do fuso, não o do UTC', () => {
    expect(dataNoFuso(new Date('2026-06-16T01:30:00Z'))).toBe('2026-06-15');
  });

  it('horarioNoPassado: o minuto atual vale, o anterior não', () => {
    const agora = new Date('2026-06-15T13:00:30Z'); // 10:00:30 em São Paulo
    expect(horarioNoPassado('2026-06-15', '10:00', TZ_REUNIOES, agora)).toBe(
      false,
    );
    expect(horarioNoPassado('2026-06-15', '09:59', TZ_REUNIOES, agora)).toBe(
      true,
    );
  });

  it('hojeNoFusoComoDataLocal usa o dia de São Paulo', () => {
    const hoje = hojeNoFusoComoDataLocal(new Date('2026-06-16T01:30:00Z'));
    expect([hoje.getFullYear(), hoje.getMonth(), hoje.getDate()]).toEqual([
      2026, 5, 15,
    ]);
  });
});
