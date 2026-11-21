import { describe, expect, it } from '@jest/globals';

import type { SubSystemStatus } from '@/services/monitoringService';
import { areActionsDisabled, isActionAvailable, resolveStatus } from '@/utils/subsistemaStatus';

const lista: SubSystemStatus[] = [
  { id: 1, subSystem: 'monitoring', status: 'DOWN', message: null, checkedAt: null },
];

describe('subsistemaStatus', () => {
  it('devolve UNKNOWN quando a lista é nula', () => {
    expect(resolveStatus(null, 'monitoring')).toBe('UNKNOWN');
  });

  it('devolve UNKNOWN quando a chave não está na lista', () => {
    expect(resolveStatus(lista, 'management')).toBe('UNKNOWN');
  });

  it('devolve o status da chave encontrada', () => {
    expect(resolveStatus(lista, 'monitoring')).toBe('DOWN');
  });

  it('libera iniciar quando o status é UNKNOWN', () => {
    expect(isActionAvailable('start', 'UNKNOWN')).toBe(true);
  });

  it('não permite parar um subsistema que está fora do ar', () => {
    expect(isActionAvailable('stop', 'DOWN')).toBe(false);
  });

  it('não permite iniciar um subsistema que está operacional', () => {
    expect(isActionAvailable('start', 'OPERATIONAL')).toBe(false);
  });

  it('mantém as ações liberadas quando a gestão está UNKNOWN', () => {
    expect(areActionsDisabled('UNKNOWN')).toBe(false);
  });

  it('desabilita as ações quando a gestão está fora do ar', () => {
    expect(areActionsDisabled('DOWN')).toBe(true);
  });

  it('mantém as ações liberadas quando a gestão está operacional', () => {
    expect(areActionsDisabled('OPERATIONAL')).toBe(false);
  });
});
