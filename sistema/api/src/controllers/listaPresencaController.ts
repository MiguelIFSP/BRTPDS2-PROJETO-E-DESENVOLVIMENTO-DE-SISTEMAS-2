import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  eventoPresencaSchema,
  marcacaoPresencaRealSchema,
} from '../schemas/listaPresencaEventoSchema.ts';
import { listaPresencaService } from '../services/listaPresencaService.ts';
import { parseId } from '../utils/parseId.ts';

export const listaPresencaController = {
  async getByReuniao(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    response
      .status(200)
      .json(
        await listaPresencaService.getByReuniao(
          userId,
          role,
          parseId(request.params.id, 'da reunião'),
        ),
      );
  },

  async updateMark(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const participanteId = parseId(request.params.userId, 'do participante');
    const { status } = await marcacaoPresencaRealSchema.validate(request.body, {
      stripUnknown: true,
    });
    response
      .status(200)
      .json(
        await listaPresencaService.updateMark(
          userId,
          role,
          reuniaoId,
          participanteId,
          status,
        ),
      );
  },

  async addEvent(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const participanteId = parseId(request.params.userId, 'do participante');
    const data = await eventoPresencaSchema.validate(request.body, {
      stripUnknown: true,
    });
    response
      .status(201)
      .json(
        await listaPresencaService.addEvent(
          userId,
          role,
          reuniaoId,
          participanteId,
          data,
        ),
      );
  },
};
