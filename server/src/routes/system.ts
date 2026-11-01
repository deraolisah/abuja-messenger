import { Router } from "express";

import { getDatabaseState } from "../config/database.js";
import { Vehicle } from "../models/Vehicle.js";
import { asyncRoute } from "./asyncRoute.js";

export const systemRouter: ReturnType<typeof Router> = Router();

systemRouter.get("/health", (req, res) => {
  const database = getDatabaseState();
  res.status(200).json({
    status: database === "connected" ? "ok" : "degraded",
    service: "abuja-messenger-api",
    database,
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
});

systemRouter.get(
  "/vehicles",
  asyncRoute(async (_req, res) => {
    const vehicles = await Vehicle.find({ active: true }).sort({ baseFareKobo: 1 }).lean();
    res.json({ vehicles });
  }),
);