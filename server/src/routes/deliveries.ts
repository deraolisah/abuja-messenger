// apps/api/src/routes/deliveries.ts
import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../lib/http";
import { requireAuth } from "../middleware/auth";
import * as deliveryService from "../services/delivery.service";

export const deliveriesRouter = Router();

// Phase 2 stub — returns 503 with a clear message. The client already handles
// this by falling back to demo data in DEMO_MODE, otherwise showing an error.
deliveriesRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    await deliveryService.createDelivery(req.body);
    res.status(201).json({ trackingCode: "" }); // unreachable
  }),
);

// Public tracking endpoint — the client polls this.
deliveriesRouter.get(
  "/track/:trackingCode",
  asyncHandler(async (req, res) => {
    const Code = z.string().min(4).max(32);
    const code = Code.parse(req.params.trackingCode).toUpperCase();
    const snapshot = await deliveryService.getTrackingSnapshot(code);
    res.json(snapshot);
  }),
);