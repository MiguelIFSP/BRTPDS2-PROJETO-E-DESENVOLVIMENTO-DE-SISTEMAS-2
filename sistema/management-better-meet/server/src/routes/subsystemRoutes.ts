import { Router } from 'express';
import { subsystemController } from '../controllers/subsystemController.ts';
import { requireAdmin, requireAuth } from '../middlewares/authMiddleware.ts';

const subsystemRoutes = Router();

// :name aceita "api" | "monitoring" | "management" (a própria) | "database" | "monitoring-database".
// :action aceita "start" | "stop" | "restart". Ambos validados no controller.
subsystemRoutes.post(
  '/subsystems/:name/:action',
  requireAuth,
  requireAdmin,
  subsystemController.executeAction,
);

export default subsystemRoutes;
