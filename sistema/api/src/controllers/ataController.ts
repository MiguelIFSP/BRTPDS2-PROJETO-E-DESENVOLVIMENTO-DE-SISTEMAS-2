import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  ataSchema,
  ataVotoSchema,
  ataExportacaoSchema,
} from '../schemas/ataSchema.ts';
import { ataService } from '../services/ataService.ts';
import { parseId } from '../utils/parseId.ts';

export const ataController = {
  async getByReuniao(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    response.json(
      await ataService.getByReuniao(
        userId,
        parseId(request.params.id, 'da reunião'),
      ),
    );
  },
  async save(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const { conteudoAta, versaoAta } = await ataSchema.validate(request.body, {
      stripUnknown: true,
    });
    response.json(
      await ataService.save(userId, reuniaoId, conteudoAta, versaoAta),
    );
  },
  async exportar(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const { versaoAta } = await ataExportacaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    response.json(await ataService.exportar(userId, reuniaoId, versaoAta));
  },
  async vote(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const { status, versaoAta } = await ataVotoSchema.validate(request.body, {
      stripUnknown: true,
    });
    response.json(await ataService.vote(userId, reuniaoId, status, versaoAta));
  },
};
