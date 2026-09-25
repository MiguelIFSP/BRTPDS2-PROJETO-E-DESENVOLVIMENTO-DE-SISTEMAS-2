import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Comparação em tempo constante via hash: evita timing attack e o throw do
// timingSafeEqual quando os buffers têm tamanhos diferentes.
function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
  const key = req.header("x-api-key");
  if (!key || !process.env.INTERNAL_API_KEY || !safeCompare(key, process.env.INTERNAL_API_KEY)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}