import { describe, expect, it } from '@jest/globals';

import { formatDate, formatMonthLabel, getInitials } from '@/utils/format';

describe('format', () => {
  it.each([
    ['Maria Souza Lima', 'MS'],
    ['ana', 'A'],
    ['  João   Pedro ', 'JP'],
    ['', ''],
  ])('getInitials("%s") = "%s"', (name, expected) => {
    expect(getInitials(name)).toBe(expected);
  });

  it('formatMonthLabel converte "AAAA-MM" para "mês/AA"', () => {
    expect(formatMonthLabel('2026-09')).toBe('set/26');
    expect(formatMonthLabel('2025-01')).toBe('jan/25');
  });

  it('formatDate devolve travessão para data inválida', () => {
    expect(formatDate('não é data')).toBe('—');
  });
});
