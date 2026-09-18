import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Valida o JWT emitido pelo /login da data-api — protege os GET que o painel do app mobile consome
export function jwtAuthGuard(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Token não informado" });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
