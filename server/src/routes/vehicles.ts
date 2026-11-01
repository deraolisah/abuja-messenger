// apps/api/src/routes/vehicles.ts
import { Router } from "express";

import { asyncHandler } from "../lib/http";
import { Vehicle } from "../models/Vehicle";

export const vehiclesRouter = Router();

vehiclesRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const vehicles = await Vehicle.find({ active: true })
      .select("slug name description maxWeightKg baseFareKobo pricePerKmKobo minimumFareKobo estimatedSpeedKph")
      .lean();
    res.json({ vehicles });
  }),
);