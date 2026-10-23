import { StatusConviteReuniao } from '@prisma/client';
import type { Request, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import {
  paginaResposta,
  type RespostaDoLink,
} from '../services/email/paginaResposta.ts';
import { reuniaoService } from '../services/reuniaoService.ts';

const STATUS_DA_RESPOSTA = {
  aceitar: StatusConviteReuniao.ACEITO,
  recusar: StatusConviteReuniao.RECUSADO,
} satisfies Record<RespostaDoLink, StatusConviteReuniao>;

const isResposta = (valor: unknown): valor is RespostaDoLink =>
  valor === 'aceitar' || valor === 'recusar';

// O token na URL é a credencial: a página não pode ficar em cache, ser
// indexada nem vazar o endereço para outro site pelo Referer.
const enviarPagina = (response: Response, status: number, html: string) => {
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

const tokenDaRota = (request: Request) => String(request.params.token);

export const conviteRespostaController = {
  // GET: só mostra. Nunca grava a resposta (ver paginaResposta.ts).
  async mostrar(request: Request, response: Response) {
    const token = tokenDaRota(request);
    const convite = await reuniaoService.buscarConvitePorToken(token);
    if (!convite) {
      enviarPagina(
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
      enviarPagina(
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
      enviarPagina(
        response,
        200,
        paginaResposta.mensagem(
          'Convite já respondido',
          `Sua resposta foi: ${convite.status === StatusConviteReuniao.ACEITO ? 'aceito' : 'recusado'}. Para mudar, fale com quem organizou a reunião.`,
        ),
      );
      return;
    }

    const { resposta } = request.query;
    enviarPagina(
      response,
      200,
      isResposta(resposta)
        ? paginaResposta.confirmar(convite, token, resposta)
        : paginaResposta.escolher(convite, token),
    );
  },

  // POST do botão de confirmação: grava com as mesmas regras do app.
  async responder(request: Request, response: Response) {
    const resposta = (request.body as { resposta?: unknown } | undefined)
      ?.resposta;
    if (!isResposta(resposta)) {
      enviarPagina(
        response,
        400,
        paginaResposta.mensagem(
          'Resposta inválida',
          'Volte ao e-mail e use o botão Aceitar ou Recusar.',
        ),
      );
      return;
    }

    try {
      await reuniaoService.respondInviteByToken(
        tokenDaRota(request),
        STATUS_DA_RESPOSTA[resposta],
      );
    } catch (error) {
      if (error instanceof AppError) {
        enviarPagina(
          response,
          error.statusCode,
          paginaResposta.mensagem('Não foi possível responder', error.message),
        );
        return;
      }
      throw error;
    }

    enviarPagina(
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
  },
};
