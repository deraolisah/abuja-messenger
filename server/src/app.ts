// server/src/app.ts
import path from "node:path";
import { fileURLToPath } from "node:url";

import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env, isProduction } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { requestId } from "./middleware/request.js";

import { authRouter } from "./modules/auth/routes.js";
import { adminRouter } from "./modules/admin/routes.js";
import { riderRouter } from "./modules/rider/routes.js";
import { deliveriesRouter } from "./modules/deliveries/routes.js";
import { vehiclesRouter } from "./modules/vehicles/routes.js";
import { systemRouter } from "./routes/system.js";
import { resolveAuth } from "./middleware/auth.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const webRoot = path.join(repoRoot, "client");
const webDist = path.join(webRoot, "dist");
const publicRoot = path.join(webRoot, "public");

function allowedOrigin(origin: string | undefined) {
  if (!origin) return true;
  return [
    env.APP_ORIGIN,
    "http://localhost:3030",
    "http://127.0.0.1:3030",
    "http://localhost:3000",
  ].includes(origin);
}

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet({ contentSecurityPolicy: false, frameguard: false }));
  app.use(
    cors({
      credentials: true,
      origin: (origin, callback) => callback(null, allowedOrigin(origin)),
    }),
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: 120,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );
  app.use(requestId);
  app.use(pinoHttp());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));

  // app.get("/manus-routes.json", (_req, res) => {
  //   res.sendFile(path.join(publicRoot, "manus-routes.json"));
  // });


  // 
  app.use(resolveAuth);

  app.use("/api/v1", systemRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/rider", riderRouter);
  app.use("/api/v1/deliveries", deliveriesRouter);
  app.use("/api/v1/vehicles", vehiclesRouter);

  // In production, serve the built client and fall back to index.html
  if (isProduction) {
    app.use(express.static(webDist, { index: false }));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(webDist, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}