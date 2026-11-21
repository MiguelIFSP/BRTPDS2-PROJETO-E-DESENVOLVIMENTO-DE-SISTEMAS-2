import { describe, expect, it } from '@jest/globals';

import {
  mensagemDeLogin,
  textoConfirmacao,
  textoEmailPendente,
} from '@/utils/authMensagens';

describe('authMensagens', () => {
  it('mensagemDeLogin cobre senha errada, limite e rede', () => {
    expect(mensagemDeLogin('invalid')).toBe('E-mail ou senha incorretos.');
    expect(mensagemDeLogin('rateLimited')).toContain('Muitas tentativas');
    expect(mensagemDeLogin('network')).toContain('conectar');
    expect(mensagemDeLogin('unknown')).toBe('Não foi possível entrar.');
  });

  it('textoConfirmacao cita o e-mail e não diz "já cadastrado"', () => {
    const texto = textoConfirmacao('ana@exemplo.com');
    expect(texto).toContain('ana@exemplo.com');
    expect(texto).not.toMatch(/já cadastrad/i);
  });

  it('textoEmailPendente avisa que o e-mail atual continua valendo', () => {
    expect(textoEmailPendente('novo@exemplo.com')).toBe(
      'Enviamos um link de confirmação para novo@exemplo.com. O e-mail atual continua valendo até você confirmar.',
    );
  });
});
