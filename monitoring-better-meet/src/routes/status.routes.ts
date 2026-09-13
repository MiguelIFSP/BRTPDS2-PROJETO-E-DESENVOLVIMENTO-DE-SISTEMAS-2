import { Router } from "express";
import { createStatusCheck, getCurrentStatus, getDailyStatusReport, getSubSystemHistory } from "../controllers/status.controller";
import { apiKeyGuard } from "../middlewares/apiKey";
import { jwtAuthGuard } from "../middlewares/jwtAuth";

const router = Router();

router.post("/status", apiKeyGuard, createStatusCheck);                        // grava um check (protegido por API key)
router.get("/status", jwtAuthGuard, getCurrentStatus);                         // status atual por sub-sistema (painel do app, protegido por JWT)
router.get("/status/daily", jwtAuthGuard, getDailyStatusReport);               // relatório diário (?date=YYYY-MM-DD)
router.get("/status/:subSystemId/history", jwtAuthGuard, getSubSystemHistory); // histórico de um sub-sistema
export default router;