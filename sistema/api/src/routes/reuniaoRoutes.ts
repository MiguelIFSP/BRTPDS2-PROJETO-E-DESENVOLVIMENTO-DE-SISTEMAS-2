import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.ts';
import { reuniaoController } from '../controllers/reuniaoController.ts';

const routes = Router();

routes.get('/reunioes/minhas', requireAuth, reuniaoController.listMine);
routes.get(
  '/reunioes/convites',
  requireAuth,
  reuniaoController.listPendingInvites,
);
routes.post('/reunioes', requireAuth, reuniaoController.create);
routes.patch(
  '/reunioes/convites/:inviteId/responder',
  requireAuth,
  reuniaoController.respondInvite,
);

export default routes;
