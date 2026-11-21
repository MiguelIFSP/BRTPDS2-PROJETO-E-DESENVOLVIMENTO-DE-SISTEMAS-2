import { describe, expect, test } from '@jest/globals';
import {
  addDays,
  isValidDateKey,
  localDateKey,
  startOfLocalDay,
} from '../src/utils/timeZone.ts';

describe('timeZone', () => {
  test('22h de Brasília continua no mesmo dia (01h UTC do dia seguinte)', () => {
    expect(localDateKey(new Date('2026-03-11T01:00:00Z'))).toBe('2026-03-10');
  });

  test('startOfLocalDay devolve a meia-noite de Brasília em UTC', () => {
    expect(startOfLocalDay('2026-03-10').toISOString()).toBe(
      '2026-03-10T03:00:00.000Z',
    );
  });

  test('addDays vira mês e ano', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('isValidDateKey recusa datas inexistentes', () => {
    expect(isValidDateKey('2026-02-30')).toBe(false);
    expect(isValidDateKey('2026-13-01')).toBe(false);
    expect(isValidDateKey('abc')).toBe(false);
    expect(isValidDateKey('2026-02-28')).toBe(true);
  });
});
