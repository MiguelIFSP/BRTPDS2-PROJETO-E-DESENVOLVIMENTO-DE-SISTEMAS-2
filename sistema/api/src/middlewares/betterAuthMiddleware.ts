import { Readable } from 'node:stream';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';
import { auth, CABECALHO_IP } from '../lib/auth.ts';
import { traduzirErroAuth } from '../lib/authErros.ts';

// Os corpos de /api/auth são pequenos (e-mail, senha, token); acima disso a
// requisição é recusada antes de ler, já que este handler vem antes do express.json().
const LIMITE_CORPO_BYTES = 100_000;

const SEM_CORPO = ['GET', 'HEAD'];

const lerJson = (
  texto: string,
): { code?: unknown; message?: unknown } | null => {
  try {
    const valor: unknown = JSON.parse(texto);
    return typeof valor === 'object' && valor !== null ? valor : null;
  } catch {
    return null;
  }
};

const montarRequest = (request: Request) => {
  const headers = fromNodeHeaders(request.headers);
  // O IP vem do Express (que respeita TRUST_PROXY); o que o cliente mandar é descartado.
  headers.set(CABECALHO_IP, request.ip ?? '');
  const url = `${request.protocol}://${request.get('host') ?? 'localhost'}${request.originalUrl}`;
  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
  };
  if (!SEM_CORPO.includes(request.method)) {
    init.body = Readable.toWeb(request) as ReadableStream;
    init.duplex = 'half';
  }
  return new Request(url, init);
};

/**
 * Entrega /api/auth/* ao Better Auth e devolve a resposta no padrão da API:
 * erros viram { error, code, message } com a mensagem em pt-BR.
 */
export const betterAuthMiddleware = async (
  request: Request,
  response: Response,
) => {
  const tamanho = Number(request.headers['content-length'] ?? 0);
  if (tamanho > LIMITE_CORPO_BYTES) {
    response.status(413).json({ error: 'Corpo da requisição grande demais.' });
    return;
  }

  const resposta = await auth.handler(montarRequest(request));

  response.status(resposta.status);
  resposta.headers.forEach((valor, nome) => {
    if (nome !== 'set-cookie') response.setHeader(nome, valor);
  });
  const cookies = resposta.headers.getSetCookie();
  if (cookies.length > 0) response.setHeader('set-cookie', cookies);

  const texto = await resposta.text();
  if (resposta.status < 400) {
    response.send(texto);
    return;
  }

  const traduzido = traduzirErroAuth(
    resposta.status,
    lerJson(texto),
    resposta.headers.get('x-retry-after'),
  );
  response.removeHeader('content-length');
  // rota desligada responde em texto puro; sem isto o JSON sairia como text/plain.
  response.removeHeader('content-type');
  response.status(traduzido.status).json({
    error: traduzido.error,
    message: traduzido.error,
    ...(traduzido.code ? { code: traduzido.code } : {}),
  });
};
