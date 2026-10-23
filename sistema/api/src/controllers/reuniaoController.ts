import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middlewares/authMiddleware.ts';
import {
  atualizarReuniaoSchema,
  convidarMembrosReuniaoSchema,
  reuniaoSchema,
  responderConviteSchema,
} from '../schemas/reuniaoSchema.ts';
import { reuniaoService } from '../services/reuniaoService.ts';
import { parseId } from '../utils/parseId.ts';

export const reuniaoController = {
  async listMine(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const reunioes = await reuniaoService.listMine(userId);
    response.status(200).json(reunioes);
  },

  async checkIn(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const result = await reuniaoService.checkIn(userId, reuniaoId);
    response.status(result.jaRegistrado ? 200 : 201).json({
      ...result,
      message: result.jaRegistrado
        ? 'Sua presença já está registrada nesta reunião.'
        : 'Presença confirmada.',
    });
  },

  async checkOut(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const result = await reuniaoService.checkOut(userId, reuniaoId);
    response.status(200).json({
      ...result,
      message: result.jaRegistrado
        ? 'Sua saída já está registrada nesta reunião.'
        : 'Saída registrada.',
    });
  },

  async listPendingInvites(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const convites = await reuniaoService.listPendingInvites(userId);
    response.status(200).json(convites);
  },

  async create(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const data = await reuniaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const reuniao = await reuniaoService.create(userId, data);
    response.status(201).json(reuniao);
  },

  async update(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const data = await atualizarReuniaoSchema.validate(request.body, {
      stripUnknown: true,
    });
    const reuniao = await reuniaoService.update(userId, role, reuniaoId, data);
    response.status(200).json(reuniao);
  },

  async delete(request: Request, response: Response) {
    const { id: userId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const { avisados } = await reuniaoService.delete(userId, role, reuniaoId);
    response.status(200).json({
      message:
        avisados > 0
          ? `Reunião removida. ${avisados} participante(s) avisado(s).`
          : 'Reunião removida com sucesso.',
    });
  },

  async inviteMembers(request: Request, response: Response) {
    const { id: actorId, role } = (request as AuthenticatedRequest).user;
    const reuniaoId = parseId(request.params.id, 'da reunião');
    const { convidados } = await convidarMembrosReuniaoSchema.validate(
      request.body,
      { stripUnknown: true },
    );
    const result = await reuniaoService.inviteMembers(
      actorId,
      role,
      reuniaoId,
      convidados,
    );
    response.status(201).json(result);
  },

  async respondInvite(request: Request, response: Response) {
    const { id: userId } = (request as AuthenticatedRequest).user;
    const inviteId = parseId(request.params.inviteId, 'do convite');
    const { status } = await responderConviteSchema.validate(request.body, {
      stripUnknown: true,
    });
    const convite = await reuniaoService.respondInvite(
      userId,
      inviteId,
      status,
    );
    response.status(200).json(convite);
  },
};
