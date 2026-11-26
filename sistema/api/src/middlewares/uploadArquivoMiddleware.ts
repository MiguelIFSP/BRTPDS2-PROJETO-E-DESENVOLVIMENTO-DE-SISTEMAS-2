import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.ts';
import { LIMITE_ARQUIVO_BYTES } from '../services/arquivoReuniaoService.ts';

export type ArquivoRecebido = { nome: string; conteudo: Buffer };

export type RequisicaoComArquivo = Request & {
  arquivoRecebido?: ArquivoRecebido;
};

// Um arquivo por requisição, em bytes crus. O nome vem no cabeçalho porque o
// corpo não é JSON. O limite é conferido de novo no service.
export const receberArquivoBinario = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  const tipo = String(request.headers['content-type'] ?? '')
    .split(';')[0]
    ?.trim()
    .toLowerCase();
  if (tipo !== 'application/octet-stream') {
    next(new AppError(400, 'Envie o arquivo em conteúdo binário.'));
    return;
  }

  const anunciado = Number(request.headers['content-length']);
  if (Number.isFinite(anunciado) && anunciado > LIMITE_ARQUIVO_BYTES) {
    next(new AppError(413, 'O arquivo passa de 25 MB.'));
    return;
  }

  const nomeCodificado = request.headers['x-nome-arquivo'];
  if (typeof nomeCodificado !== 'string' || !nomeCodificado.trim()) {
    next(new AppError(400, 'Informe o nome do arquivo.'));
    return;
  }
  let nome: string;
  try {
    nome = decodeURIComponent(nomeCodificado);
  } catch {
    next(new AppError(400, 'O nome do arquivo é inválido.'));
    return;
  }

  const partes: Buffer[] = [];
  let total = 0;
  let recusado = false;
  const recusar = (erro: AppError) => {
    if (recusado) return;
    recusado = true;
    request.pause();
    next(erro);
  };

  request.on('data', (chunk: Buffer) => {
    total += chunk.length;
    if (total > LIMITE_ARQUIVO_BYTES) {
      recusar(new AppError(413, 'O arquivo passa de 25 MB.'));
      return;
    }
    partes.push(chunk);
  });
  request.on('aborted', () => {
    recusar(new AppError(400, 'Não foi possível ler o arquivo.'));
  });
  request.on('end', () => {
    if (recusado) return;
    const conteudo = Buffer.concat(partes);
    if (conteudo.length === 0) {
      next(new AppError(400, 'O arquivo está vazio.'));
      return;
    }
    (request as RequisicaoComArquivo).arquivoRecebido = { nome, conteudo };
    next();
  });
};
