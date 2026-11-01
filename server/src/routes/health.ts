// apps/api/src/routes/health.ts
import { Router } from "express";

import { isDbConnected } from "../config/database";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "abuja-messenger-api",
    db: isDbConnected() ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});