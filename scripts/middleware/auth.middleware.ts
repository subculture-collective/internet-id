import { Request, Response, NextFunction } from "express";

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.API_KEY;
  if (!expected) return next();
  const provided = req.header("x-api-key") || req.header("authorization");
  if (provided === expected) return next();
  res.status(401).json({ error: "Unauthorized" });
}
