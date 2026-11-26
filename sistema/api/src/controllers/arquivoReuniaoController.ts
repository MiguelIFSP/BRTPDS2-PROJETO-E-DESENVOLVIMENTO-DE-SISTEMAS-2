import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import type { RequisicaoComArquivo } from '../middlewares/uploadArquivoMiddleware.ts';
import { AppError } from '../errors/AppError.ts';
import { arquivoReuniaoService } from '../services/arquivoReuniaoService.ts';
import { parseId } from '../utils/parseId.ts';

const nomeParaCabecalho = (nome: string) => {
  const ascii = nome.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
  return `attachment; filename="${ascii || 'arquivo'}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
};

export const arquivoReuniaoController = {
  async list(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const biblioteca = await arquivoReuniaoService.list(
      userId,
      role,
      reuniaoId,
    );
    response.status(200).json(biblioteca);
  },

  async criar(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const arquivo = (request as RequisicaoComArquivo).arquivoRecebido;
    if (!arquivo) throw new AppError(400, 'Envie o arquivo.');
    const criado = await arquivoReuniaoService.criar(
      userId,
      role,
      reuniaoId,
      arquivo,
    );
    response.status(201).json(criado);
  },

  async baixar(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const arquivoId = parseId(request.params.arquivoId, 'do arquivo');
    const arquivo = await arquivoReuniaoService.ler(
      userId,
      role,
      reuniaoId,
      arquivoId,
    );
    response.setHeader('Content-Type', 'application/octet-stream');
    response.setHeader('Content-Length', String(arquivo.conteudo.length));
    response.setHeader('Content-Disposition', nomeParaCabecalho(arquivo.nome));
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.status(200).send(arquivo.conteudo);
  },

  async remover(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const arquivoId = parseId(request.params.arquivoId, 'do arquivo');
    await arquivoReuniaoService.remover(userId, role, reuniaoId, arquivoId);
    response.status(200).json({ message: 'Arquivo apagado.' });
  },
};
