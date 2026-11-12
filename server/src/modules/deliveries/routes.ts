// server/src/modules/deliveries/routes.ts
import { Router } from "express";
import { z } from "zod";

import { asyncRoute } from "../../routes/asyncRoute.js";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { createDelivery, getTrackingSnapshot } from "./service.js";

import { VEHICLE_SEEDS } from "@abuja-messenger/contracts";

export const deliveriesRouter: ReturnType<typeof Router> = Router();

const vehicleSlugEnum = z.enum(
  VEHICLE_SEEDS.map((v) => v.slug) as [string, ...string[]],
);


const createDeliverySchema = z.object({
  deliveryType: z.enum(["instant", "scheduled"]), // or whatever DELIVERY_TYPES has
//   vehicleSlug: z.string().min(1),
  vehicleSlug: vehicleSlugEnum,
  pickup: z.object({
    district: z.string().min(1),
    address: z.string().min(1),
    name: z.string().min(1),
    phone: z.string().min(7),
  }),
  dropoff: z.object({
    district: z.string().min(1),
    address: z.string().min(1),
    name: z.string().min(1),
    phone: z.string().min(7),
  }),
  package: z.object({
    category: z.string().optional(),
    description: z.string().optional(),
    weightKg: z.number().positive().optional(),
    fragile: z.boolean().optional(),
  }).optional(),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["card", "transfer", "cash"]),
  scheduledFor: z.string().datetime().optional(),
});

deliveriesRouter.post(
  "/",
  requireAuth,
  validateBody(createDeliverySchema),
  asyncRoute(async (req, res) => {
    const delivery = await createDelivery({
      ...req.body,
      customerId: String(req.user!._id),
    });
    res.status(201).json({ delivery });
  }),
);

deliveriesRouter.get(
  "/track/:trackingCode",
  asyncRoute(async (req, res) => {
    const code = String(req.params.trackingCode).toUpperCase();
    const snapshot = await getTrackingSnapshot(code);
    res.json(snapshot);
  }),
);