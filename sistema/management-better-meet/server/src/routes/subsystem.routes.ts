import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middlewares/auth';
import { executeSubsystemAction } from '../controllers/subsystem.controller';

const router = Router();

// :name aceita "api" | "monitoring" | "management" (a própria) — validado dentro do controller.
// :action aceita "start" | "stop" | "restart".
router.post('/subsystems/:name/:action', requireAuth, requireAdmin, executeSubsystemAction);

export default router;
