import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

import type { UserRole } from "@abuja-messenger/contracts";

import { env } from "../../config/env.ts";

export type AccessClaims = {
  sub: string;
  role: UserRole;
  kind: "access";
};

type RefreshClaims = {
  sub: string;
  kind: "refresh";
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function createTokenPair(userId: string, role: UserRole) {
  const accessClaims: AccessClaims = { sub: userId, role, kind: "access" };
  const refreshClaims: RefreshClaims = { sub: userId, kind: "refresh" };

  const access = jwt.sign(accessClaims, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL,
  } as SignOptions);
  const refresh = jwt.sign(refreshClaims, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL,
  } as SignOptions);

  return { access, refresh };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessClaims;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshClaims;
}

export async function hashToken(token: string) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token: string, tokenHash: string) {
  return bcrypt.compare(token, tokenHash);
}