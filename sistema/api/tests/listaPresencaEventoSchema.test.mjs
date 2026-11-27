import { describe, expect, it } from '@jest/globals';
import {
  eventoPresencaSchema,
  marcacaoPresencaRealSchema,
} from '../src/schemas/listaPresencaEventoSchema.ts';

describe('schemas da lista de presença real', () => {
  it('aceita presença manual, ausência e remoção da marcação', async () => {
    await expect(
      marcacaoPresencaRealSchema.validate({ status: 'PRESENTE' }),
    ).resolves.toEqual({ status: 'PRESENTE' });
    await expect(
      marcacaoPresencaRealSchema.validate({ status: 'AUSENTE' }),
    ).resolves.toEqual({ status: 'AUSENTE' });
    await expect(
      marcacaoPresencaRealSchema.validate({ status: 'SEM_MARCACAO' }),
    ).resolves.toEqual({ status: 'SEM_MARCACAO' });
  });

  it('aceita observação sem marcação, normaliza o texto e limita a 2.000 caracteres', async () => {
    await expect(
      marcacaoPresencaRealSchema.validate({ observacao: '  Chegou depois.  ' }),
    ).resolves.toEqual({ observacao: 'Chegou depois.' });
    await expect(
      marcacaoPresencaRealSchema.validate({
        status: 'PRESENTE',
        observacao: '',
      }),
    ).resolves.toEqual({ status: 'PRESENTE', observacao: '' });
    await expect(
      marcacaoPresencaRealSchema.validate({ observacao: 'a'.repeat(2001) }),
    ).rejects.toThrow('A observação deve ter no máximo 2.000 caracteres.');
    await expect(marcacaoPresencaRealSchema.validate({})).rejects.toThrow(
      'Informe a marcação ou as observações da pessoa.',
    );
  });

  it('exige horário HH:mm e permite motivo ausente no retorno', async () => {
    await expect(
      eventoPresencaSchema.validate({ tipo: 'RETORNO', hora: '19:45' }),
    ).resolves.toEqual({ tipo: 'RETORNO', hora: '19:45' });
    await expect(
      eventoPresencaSchema.validate({
        tipo: 'SAIDA',
        hora: '19:45',
        motivo: 'Consulta',
      }),
    ).resolves.toEqual({ tipo: 'SAIDA', hora: '19:45', motivo: 'Consulta' });
    await expect(
      eventoPresencaSchema.validate({ tipo: 'SAIDA', hora: '27:80' }),
    ).rejects.toThrow();
  });
});
