import { StatusConviteReuniao } from '@prisma/client';
import type { Request, Response } from 'express';
import * as yup from 'yup';
import { AppError } from '../errors/AppError.ts';
import { conviteRespostaSchema } from '../schemas/conviteRespostaSchema.ts';
import { reuniaoService } from '../services/reuniaoService.ts';
import {
  RESPOSTAS_DO_LINK,
  paginaResposta,
  type RespostaDoLink,
} from '../utils/paginaResposta.ts';

// EXCEÇÃO ao EX-04 e ao EX-05: estas rotas são abertas no navegador pelos
// botões do e-mail, então respondem HTML, inclusive nos erros. Por isso o
// controller converte os próprios erros em página, em vez de deixar o JSON do
// errorMiddleware chegar ao convidado.

const STATUS_DA_RESPOSTA = {
  aceitar: StatusConviteReuniao.ACEITO,
  recusar: StatusConviteReuniao.RECUSADO,
} satisfies Record<RespostaDoLink, StatusConviteReuniao>;

// O ?resposta= do link só escolhe qual página mostrar; valor desconhecido
// mostra as duas opções, sem erro.
const isResposta = (valor: unknown): valor is RespostaDoLink =>
  RESPOSTAS_DO_LINK.some((resposta) => resposta === valor);

// O token na URL é a credencial: a página não pode ficar em cache, ser
// indexada nem vazar o endereço para outro site pelo Referer.
const sendPage = (response: Response, status: number, html: string) => {
  response
    .status(status)
    .set({
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'",
    })
    .type('html')
    .send(html);
};

const getToken = (request: Request) => String(request.params.token);

export const conviteRespostaController = {
  // GET: só mostra. Nunca grava a resposta (ver paginaResposta.ts).
  async show(request: Request, response: Response) {
    const token = getToken(request);
    const convite = await reuniaoService.getConviteByToken(token);
    if (!convite) {
      sendPage(
        response,
        404,
        paginaResposta.mensagem(
          'Convite não encontrado',
          'O link é inválido ou a reunião foi excluída.',
        ),
      );
      return;
    }
    if (convite.reuniao.status === 'CANCELADA') {
      sendPage(
        response,
        409,
        paginaResposta.mensagem(
          'Reunião cancelada',
          'Esta reunião foi cancelada e não aceita mais respostas.',
        ),
      );
      return;
    }
    if (convite.status !== StatusConviteReuniao.PENDENTE) {
      sendPage(
        response,
        200,
        paginaResposta.mensagem(
          'Convite já respondido',
          `Sua resposta foi: ${convite.status === StatusConviteReuniao.ACEITO ? 'aceito' : 'recusado'}. Para mudar, fale com quem organizou a reunião.`,
        ),
      );
      return;
    }

    if (reuniaoService.isConviteExpirado(convite.reuniao)) {
      sendPage(
        response,
        410,
        paginaResposta.mensagem(
          'Reunião encerrada',
          'Esta reunião já terminou, e o convite não pode mais ser respondido.',
        ),
      );
      return;
    }

    const { resposta } = request.query;
    sendPage(
      response,
      200,
      isResposta(resposta)
        ? paginaResposta.confirm(convite, token, resposta)
        : paginaResposta.choose(convite, token),
    );
  },

  // POST do botão de confirmação: grava com as mesmas regras do app.
  async respond(request: Request, response: Response) {
    try {
      const { resposta } = await conviteRespostaSchema.validate(
        request.body ?? {},
        { stripUnknown: true },
      );
      await reuniaoService.respondInviteByToken(
        getToken(request),
        STATUS_DA_RESPOSTA[resposta],
      );

      sendPage(
        response,
        200,
        resposta === 'aceitar'
          ? paginaResposta.mensagem(
              'Presença confirmada',
              'Você aceitou o convite. A reunião já aparece no app, e os lembretes chegam por e-mail.',
            )
          : paginaResposta.mensagem(
              'Convite recusado',
              'Sua resposta foi registrada. Quem organizou a reunião verá no app.',
            ),
      );
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        sendPage(
          response,
          400,
          paginaResposta.mensagem(
            'Resposta inválida',
            'Volte ao e-mail e use o botão Aceitar ou Recusar.',
          ),
        );
        return;
      }
      if (error instanceof AppError) {
        sendPage(
          response,
          error.statusCode,
          paginaResposta.mensagem('Não foi possível responder', error.message),
        );
        return;
      }
      throw error;
    }
  },
};
