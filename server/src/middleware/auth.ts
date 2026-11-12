// server/src/middleware/auth.ts
import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { UserRole } from "@abuja-messenger/contracts";

import { isDatabaseReady } from "../config/database.js";
import { AppError } from "./errors.js";
import { User, toPublicUser } from "../models/User.js";
import { readPlatformIdentity } from "../modules/auth/platformIdentity.js";
import { verifyAccessToken } from "../modules/auth/tokens.js";

function readBearerToken(req: Request) {
  const header = req.header("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.am_access_token;
}

/**
 * Resolves `req.user` from a valid access cookie/Bearer, or falls back to a
 * Manus platform session (Preview auto-login) when configured.
 * Never throws — downstream `requireAuth` decides whether auth is required.
 */
export async function resolveAuth(req: Request, _res: Response, next: NextFunction) {
  const accessToken = readBearerToken(req);

  if (accessToken && isDatabaseReady()) {
    try {
      const claims = verifyAccessToken(accessToken);
      // const user = await User.findById(claims.sub).select("+passwordHash");
      const user = await User.findById(claims.sub);
      if (user && user.role === claims.role) {
        req.user = user;
        next();
        return;
      }
    } catch {
      // Invalid or expired tokens are treated as anonymous — protected routes reject below.
    }
  }

  const platformIdentity = readPlatformIdentity(req.cookies?.webdev_app_session);
  if (platformIdentity) {
    req.platformIdentity = platformIdentity;
    if (isDatabaseReady() && platformIdentity.email) {
      const user = await User.findOne({ email: platformIdentity.email.toLowerCase() });
      if (user) {
        req.user = user;
      }
    }
  }

  next();
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) {
    next(new AppError(401, "AUTH_REQUIRED", "Please log in to continue."));
    return;
  }
  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError(401, "AUTH_REQUIRED", "Please log in to continue."));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, "FORBIDDEN", "You do not have access to this area."));
      return;
    }
    next();
  };
}

// middleware/auth.ts
export const requireActiveRider: RequestHandler = (req, _res, next) => {
  if (!req.user) { next(new AppError(401, "AUTH_REQUIRED", "Please log in.")); return; }
  if (req.user.role !== "rider") { next(new AppError(403, "NOT_A_RIDER", "Riders only.")); return; }
  if (req.user.riderVerificationStatus !== "active") {
    next(new AppError(403, "RIDER_SUSPENDED", "Your account is suspended."));
    return;
  }
  next();
};


export function getRequestUser(req: Request) {
  return req.user ? toPublicUser(req.user) : null;
}