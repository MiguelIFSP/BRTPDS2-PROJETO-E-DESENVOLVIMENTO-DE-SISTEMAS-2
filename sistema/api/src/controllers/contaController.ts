import type { Request, Response } from 'express';
import { getResultadoConfirmacao, paginaConta } from '../utils/paginaConta.ts';
import { sendPage } from '../utils/paginaHtml.ts';

// EXCEÇÃO ao EX-04 e ao EX-05: a rota é o destino do link de confirmação do
// e-mail, aberto direto no navegador, então responde HTML.
export const contaController = {
  showEmailConfirmado(request: Request, response: Response) {
    const resultado = getResultadoConfirmacao(request.query.error);
    sendPage(
      response,
      resultado === 'confirmado' ? 200 : 400,
      paginaConta.emailConfirmado(resultado),
    );
  },
};
