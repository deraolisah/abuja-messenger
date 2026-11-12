// server/src/modules/vehicles/routes.ts
import { Router } from "express";
import { asyncRoute } from "../../routes/asyncRoute.js";
import { Vehicle } from "../../models/Vehicle.js";

export const vehiclesRouter = Router();

vehiclesRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const vehicles = await Vehicle.find({ active: true }).sort({ baseFareKobo: 1 }).lean();
    res.json({ vehicles });
  }),
);