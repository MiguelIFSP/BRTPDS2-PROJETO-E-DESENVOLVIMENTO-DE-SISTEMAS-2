import { Router } from 'express';
import { organizacaoController } from '../controllers/organizacaoController.ts';
import { requireAdmin, requireAuth } from '../middlewares/auth.ts';

const routes = Router();

routes.post('/organizacoes', requireAuth, organizacaoController.create);
routes.get('/organizacoes/minhas', requireAuth, organizacaoController.getMine);
routes.get('/organizacoes', requireAuth, requireAdmin, organizacaoController.getAll);
routes.get('/organizacoes/:id', requireAuth, organizacaoController.getById);
routes.patch('/organizacoes/:id/status', requireAuth, requireAdmin, organizacaoController.updateStatus);
routes.delete('/organizacoes/:id', requireAuth, organizacaoController.delete);
routes.post('/organizacoes/:id/membros', requireAuth, organizacaoController.addMember);
routes.delete('/organizacoes/:id/membros/:userId', requireAuth, organizacaoController.removeMember);

export default routes;