import { Router } from 'express';
import { ataController } from '../controllers/ataController.ts';
import { requireAuth } from '../middlewares/authMiddleware.ts';
import { requireAtaEditor } from '../middlewares/ataMiddleware.ts';

const routes = Router();
routes.get('/reunioes/:id/ata', requireAuth, ataController.getByReuniao);
routes.put(
  '/reunioes/:id/ata',
  requireAuth,
  requireAtaEditor,
  ataController.save,
);
routes.post('/reunioes/:id/ata/votar', requireAuth, ataController.vote);
export default routes;
