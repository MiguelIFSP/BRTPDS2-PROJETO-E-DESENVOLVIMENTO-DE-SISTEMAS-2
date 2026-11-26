import { Router } from 'express';
import { arquivoReuniaoController } from '../controllers/arquivoReuniaoController.ts';
import { requireAuth } from '../middlewares/authMiddleware.ts';
import { reuniaoController } from '../controllers/reuniaoController.ts';
import { receberArquivoBinario } from '../middlewares/uploadArquivoMiddleware.ts';
import { criarLimite } from '../middlewares/rateLimitMiddleware.ts';

const routes = Router();
const limitePresenca = criarLimite(60, 20);

routes.get('/reunioes/minhas', requireAuth, reuniaoController.listMine);
routes.get(
  '/reunioes/convites',
  requireAuth,
  reuniaoController.listPendingInvites,
);
routes.get('/reunioes/:id', requireAuth, reuniaoController.getById);
routes.get(
  '/reunioes/:id/arquivos',
  requireAuth,
  arquivoReuniaoController.list,
);
routes.post(
  '/reunioes/:id/arquivos',
  requireAuth,
  receberArquivoBinario,
  arquivoReuniaoController.criar,
);
routes.get(
  '/reunioes/:id/arquivos/:arquivoId',
  requireAuth,
  arquivoReuniaoController.baixar,
);
routes.delete(
  '/reunioes/:id/arquivos/:arquivoId',
  requireAuth,
  arquivoReuniaoController.remover,
);
routes.post('/reunioes', requireAuth, reuniaoController.create);
routes.patch('/reunioes/:id', requireAuth, reuniaoController.update);
routes.delete('/reunioes/:id', requireAuth, reuniaoController.delete);
routes.post(
  '/reunioes/:id/convites',
  requireAuth,
  reuniaoController.inviteMembers,
);
routes.post(
  '/reunioes/:id/entrar',
  requireAuth,
  limitePresenca,
  reuniaoController.checkIn,
);
routes.post(
  '/reunioes/:id/sair',
  requireAuth,
  limitePresenca,
  reuniaoController.checkOut,
);
routes.get(
  '/reunioes/:id/codigo-presenca',
  requireAuth,
  reuniaoController.getCodigoPresenca,
);
routes.post(
  '/reunioes/:id/codigo-presenca',
  requireAuth,
  limitePresenca,
  reuniaoController.renewCodigoPresenca,
);
routes.post(
  '/reunioes/:id/participantes/:userId/entrar',
  requireAuth,
  reuniaoController.registerEntradaManual,
);
routes.post(
  '/reunioes/:id/participantes/:userId/sair',
  requireAuth,
  reuniaoController.registerSaidaManual,
);
routes.patch(
  '/reunioes/convites/:inviteId/responder',
  requireAuth,
  reuniaoController.respondInvite,
);

export default routes;
