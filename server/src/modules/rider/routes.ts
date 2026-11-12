// server/src/modules/rider/routes.ts
import { Router } from "express";
import { requireActiveRider } from "../../middleware/auth.js";

export const riderRouter = Router();

riderRouter.use(requireActiveRider);   // ✅ no parens with args

// Placeholder — real job endpoints come in the next stage
riderRouter.get("/jobs", (_req, res) => {
  res.json({ jobs: [] });
});