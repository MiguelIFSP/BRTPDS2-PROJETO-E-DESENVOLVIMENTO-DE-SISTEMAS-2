import { describe, expect, test } from '@jest/globals';
import {
  ACOES_SUBSISTEMA,
  subsystemActionSchema,
} from '../src/schemas/subsystemSchema.ts';

describe('subsystemActionSchema', () => {
  test.each(ACOES_SUBSISTEMA)('aceita a ação %s', async (action) => {
    await expect(
      subsystemActionSchema.validate({ name: 'api', action }),
    ).resolves.toEqual({ name: 'api', action });
  });

  test('recusa ação desconhecida com mensagem em pt-BR', async () => {
    await expect(
      subsystemActionSchema.validate({ name: 'api', action: 'delete' }),
    ).rejects.toThrow('Ação inválida. Use: start, stop ou restart.');
  });

  test('recusa nome ausente', async () => {
    await expect(
      subsystemActionSchema.validate({ action: 'start' }),
    ).rejects.toThrow('Subsistema desconhecido.');
  });
});
