import { Router } from 'express';
import { organizacaoController } from '../controllers/organizacaoController.ts';
import { requireAdmin, requireAuth } from '../middlewares/auth.ts';

const routes = Router();

// tudo autenticado. listar todas e mudar status e so admin.

routes.post('/organizacoes', requireAuth, organizacaoController.create);
routes.get('/organizacoes/minhas', requireAuth, organizacaoController.getMine);
// precisam vir antes de /organizacoes/:id, senao "relatorio" seria lido como um id.
routes.get('/organizacoes/relatorio/minhas', requireAuth, organizacaoController.getReportMine);
routes.get('/organizacoes/relatorio', requireAuth, requireAdmin, organizacaoController.getReport);
routes.get('/organizacoes', requireAuth, requireAdmin, organizacaoController.getAll);
routes.get('/organizacoes/:id', requireAuth, organizacaoController.getById);
routes.patch('/organizacoes/:id/status', requireAuth, requireAdmin, organizacaoController.updateStatus);
routes.delete('/organizacoes/:id', requireAuth, organizacaoController.delete);
routes.post('/organizacoes/:id/membros', requireAuth, organizacaoController.addMember);
routes.patch('/organizacoes/:id/membros/:userId', requireAuth, organizacaoController.updateMemberRole);
routes.delete('/organizacoes/:id/membros/:userId', requireAuth, organizacaoController.removeMember);

export default routes;
