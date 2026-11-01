// apps/api/src/lib/jwt.ts
import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import { Unauthorized } from "./errors";

export type AccessPayload = {
  sub: string;
  role: string;
  type: "access";
};

export type RefreshPayload = {
  sub: string;
  type: "refresh";
};

export type ResetPayload = {
  sub: string;
  type: "reset";
};

export function signAccessToken(sub: string, role: string) {
  return jwt.sign({ sub, role, type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as SignOptions);
}

export function signRefreshToken(sub: string) {
  return jwt.sign({ sub, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  } as SignOptions);
}

export function signResetToken(sub: string) {
  return jwt.sign({ sub, type: "reset" }, env.PASSWORD_RESET_SECRET, {
    expiresIn: "20m",
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
    if (payload.type !== "access") throw new Error("wrong type");
    return payload;
  } catch {
    throw Unauthorized("Session expired. Please log in again.");
  }
}

export function verifyRefreshToken(token: string): RefreshPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
    if (payload.type !== "refresh") throw new Error("wrong type");
    return payload;
  } catch {
    throw Unauthorized("Refresh token invalid or expired.");
  }
}

export function verifyResetToken(token: string): ResetPayload {
  try {
    const payload = jwt.verify(token, env.PASSWORD_RESET_SECRET) as ResetPayload;
    if (payload.type !== "reset") throw new Error("wrong type");
    return payload;
  } catch {
    throw Unauthorized("Reset link is invalid or expired.");
  }
}