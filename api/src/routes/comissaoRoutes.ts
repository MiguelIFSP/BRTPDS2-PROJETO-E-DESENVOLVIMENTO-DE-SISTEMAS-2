import { Router } from 'express';
import { comissaoController } from '../controllers/comissaoController.js';

const routes = Router();

routes.post('/comissoes', comissaoController.create);
routes.get('/organizacoes/:organizacaoId/comissoes', comissaoController.getAllByOrganizacao);
routes.delete('/comissoes/:id', comissaoController.delete);
routes.post('/comissoes/:comissaoId/membros', comissaoController.addMember);
routes.delete('/comissoes/:comissaoId/membros/:userId', comissaoController.removeMember);

export default routes;