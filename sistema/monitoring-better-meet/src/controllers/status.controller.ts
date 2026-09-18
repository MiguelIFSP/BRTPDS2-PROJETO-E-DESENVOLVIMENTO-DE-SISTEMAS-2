import { Request, Response } from "express";
import { recordStatusCheck, getLatestStatus, getDailyStatus } from "../services/statusCheck.service";
import { getStatusHistoryBySubSystem } from "../services/statusCheck.service";
import { runSingleCheck } from "../jobs/healthCheck.cron";
import { StatusType } from "@prisma/client";

export async function createStatusCheck(req: Request, res: Response) {
  try {
    const { subSystem, status, message, isBlocking } = req.body;

    if (!subSystem || !status) {
      return res.status(400).json({ error: "subSystem e status são obrigatórios" });
    }
    if (!Object.values(StatusType).includes(status)) {
      return res.status(400).json({ error: `status inválido. Use: ${Object.values(StatusType).join(", ")}` });
    }

    const check = await recordStatusCheck(subSystem, status, message, Boolean(isBlocking));
    return res.status(201).json(check);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}

export async function getCurrentStatus(_req: Request, res: Response) {
  try {
    return res.json(await getLatestStatus());
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}

export async function getDailyStatusReport(req: Request, res: Response) {
  try {
    const dateParam = req.query.date as string | undefined;
    const date = dateParam ? new Date(dateParam) : new Date();

    if (isNaN(date.getTime())) {
      return res.status(400).json({ error: "Data inválida. Use YYYY-MM-DD" });
    }

    return res.json(await getDailyStatus(date));
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}

// Dispara a checagem de UM subsistema agora (fora do horário do cron) e devolve
// o status recém-gravado — usado pela management depois de start/stop/restart.
export async function checkSubSystemNow(req: Request, res: Response) {
  try {
    const { subSystem } = req.params;

    const found = await runSingleCheck(subSystem as string);
    if (!found) {
      return res.status(404).json({ error: `Subsistema desconhecido: ${subSystem}` });
    }

    const latest = await getLatestStatus();
    const result = latest.find((item) => item.subSystem === subSystem);
    return res.json(result ?? { subSystem, status: "UNKNOWN" });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}

export async function getSubSystemHistory(req: Request, res: Response) {
  try {
    const subSystemId = Number(req.params.subSystemId);
    const days = Number(req.query.days) || 7; // default de 7 dias se não vier

    if (!subSystemId) {
      return res.status(400).json({ error: "subSystemId inválido" });
    }

    const result = await getStatusHistoryBySubSystem(subSystemId, days);

    if (!result) {
      return res.status(404).json({ error: "Sub-sistema não encontrado" });
    }

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
}