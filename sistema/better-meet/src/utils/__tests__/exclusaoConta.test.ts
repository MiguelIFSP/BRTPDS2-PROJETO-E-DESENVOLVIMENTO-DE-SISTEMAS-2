import { describe, expect, it } from '@jest/globals';

import { ApiError } from '@/utils/apiClient';
import { mensagemExclusaoPendente } from '@/utils/exclusaoConta';

describe('mensagemExclusaoPendente', () => {
  it('lista organizações pendentes', () => {
    const error = new ApiError('x', 409, {
      organizacoesPendentes: [{ id: 1, nome: 'Grêmio' }],
    });
    expect(mensagemExclusaoPendente(error)).toBe(
      'Escolha quem assume Grêmio antes de excluir a conta.',
    );
  });

  it('lista comissões pendentes junto das organizações', () => {
    const error = new ApiError('x', 409, {
      organizacoesPendentes: [{ nome: 'Grêmio' }],
      comissoesPendentes: [{ nome: 'Eventos' }],
    });
    expect(mensagemExclusaoPendente(error)).toBe(
      'Escolha quem assume Grêmio, Eventos antes de excluir a conta.',
    );
  });

  it('409 sem details devolve null (vale a mensagem da API)', () => {
    expect(
      mensagemExclusaoPendente(
        new ApiError('Outra regra.', 409, { error: 'x' }),
      ),
    ).toBeNull();
  });

  it('sem pendência ou outro status devolve null', () => {
    expect(
      mensagemExclusaoPendente(
        new ApiError('x', 409, { organizacoesPendentes: [] }),
      ),
    ).toBeNull();
    expect(mensagemExclusaoPendente(new ApiError('x', 500))).toBeNull();
    expect(mensagemExclusaoPendente(new Error('x'))).toBeNull();
  });
});
