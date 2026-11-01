import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

export type PlatformIdentity = {
  openId: string;
  name?: string;
  email?: string;
};

/**
 * Reads a Manus platform session cookie (Preview auto-login).
 * Returns null when the cookie is absent or invalid. Never throws — a bad
 * cookie should fall back to anonymous, not crash the request.
 *
 * Requires MANUS_JWT_SECRET and MANUS_PROJECT_ID in the environment to be
 * active. With them unset, this returns null and local auth works normally.
 */
export function readPlatformIdentity(
  sessionCookie: string | undefined,
): PlatformIdentity | null {
  if (!sessionCookie) return null;

  const secret = process.env.MANUS_JWT_SECRET;
  const projectId = process.env.MANUS_PROJECT_ID;
  if (!secret || !projectId) return null;

  try {
    const claims = jwt.verify(sessionCookie, secret, { algorithms: ["HS256"] }) as {
      appId?: string;
      openId?: string;
      name?: string;
      email?: string;
      exp?: number;
    };

    if (claims.appId !== projectId) return null;
    if (claims.exp && claims.exp * 1000 < Date.now()) return null;
    if (!claims.openId) return null;

    return {
      openId: claims.openId,
      name: claims.name,
      email: claims.email,
    };
  } catch {
    return null;
  }
}