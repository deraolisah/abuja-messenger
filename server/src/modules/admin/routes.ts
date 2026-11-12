// server/src/modules/admin/routes.ts
import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "../../routes/asyncRoute.js";
import { requireRole } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { createRider, listRiders, suspendRider, reactivateRider } from "./service.js";

export const adminRouter = Router();

// Everything below is admin-only
adminRouter.use(requireRole("admin"));

const createRiderSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_.]+$/i, "Only letters, numbers, dots and underscores"),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  password: z.string().min(8).max(100),   // admin sets initial password
  plateNumber: z.string().min(4).max(20),
  vehicleSlug: z.string().min(1),
  licenseNumber: z.string().min(4).max(40).optional(),
  licenseExpiryAt: z.string().datetime().optional(),
});

adminRouter.post(
  "/riders",
  validateBody(createRiderSchema),
  asyncRoute(async (req, res) => {
    const result = await createRider({
      adminId: String(req.user!._id),
      ...req.body,
    });
    res.status(201).json(result);
  }),
);

adminRouter.get(
  "/riders",
  asyncRoute(async (_req, res) => {
    res.json({ riders: await listRiders() });
  }),
);

const suspendSchema = z.object({
  reason: z.string().min(3).max(500),
});

adminRouter.post(
  "/riders/:userId/suspend",
  validateBody(suspendSchema),
  asyncRoute(async (req, res) => {
    const userId = req.params.userId;
    if (typeof userId !== "string") {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const result = await suspendRider(userId, req.body.reason);
    res.json(result);
  }),
);

adminRouter.post(
  "/riders/:userId/reactivate",
  asyncRoute(async (req, res) => {
    const userId = req.params.userId;
    if (typeof userId !== "string") {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const result = await reactivateRider(userId);
    res.json(result);
  }),
);