// server/src/modules/auth/service.ts
import crypto from "node:crypto";
import type { Request, Response } from "express";

import { isDatabaseReady } from "../../config/database.js";
import { env } from "../../config/env.ts";
import { AppError } from "../../middleware/errors.js";
import { User, toPublicUser, type UserHydrated } from "../../models/User.ts";
import {
  comparePassword,
  compareToken,
  createTokenPair,
  hashPassword,
  hashToken,
  verifyRefreshToken,
} from "./tokens.ts";

const accessCookie = "am_access_token";
const refreshCookie = "am_refresh_token";

function ensureDatabase() {
  if (!isDatabaseReady()) {
    throw new AppError(503, "DATABASE_UNAVAILABLE", "Account services are not connected yet.");
  }
}

function cookieOptions(maxAge: number) {
  const crossSite = env.APP_ORIGIN.startsWith("https://");
  return {
    httpOnly: true,
    secure: crossSite,
    sameSite: crossSite ? ("none" as const) : ("lax" as const),
    maxAge,
    path: "/",
  };
}

function setSessionCookies(res: Response, tokens: { access: string; refresh: string }) {
  res.cookie(accessCookie, tokens.access, cookieOptions(15 * 60 * 1000));
  res.cookie(refreshCookie, tokens.refresh, cookieOptions(30 * 24 * 60 * 60 * 1000));
}

export function clearSessionCookies(res: Response) {
  const options = cookieOptions(0);
  res.clearCookie(accessCookie, options);
  res.clearCookie(refreshCookie, options);
}

async function persistSession(user: UserHydrated, res: Response) {
  const tokens = createTokenPair(String(user._id), user.role);
  user.refreshTokenHash = await hashToken(tokens.refresh);
  user.lastLoginAt = new Date();
  await user.save();
  setSessionCookies(res, tokens);
}

/** Accepts `displayName` (client) or `name` (legacy). */
export async function register(
  input: { displayName: string; email: string; phone?: string },
  password: string,
  res: Response,
) {
  ensureDatabase();
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, "EMAIL_IN_USE", "An account with that email already exists.");
  }

  const user = await User.create({
    name: input.displayName,
    email,
    phone: input.phone ?? null,
    passwordHash: await hashPassword(password),
    role: "customer",
    authProviders: ["local"],
  });
  await persistSession(user, res);
  return toPublicUser(user);
}

export async function login(email: string, password: string, res: Response) {
  ensureDatabase();
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash +refreshTokenHash",
  );
  if (!user?.passwordHash || !(await comparePassword(password, user.passwordHash))) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  await persistSession(user, res);
  return toPublicUser(user);
}

export async function refresh(refreshToken: string | undefined, res: Response) {
  ensureDatabase();
  if (!refreshToken) {
    throw new AppError(401, "REFRESH_REQUIRED", "Your session has expired. Please log in again.");
  }
  try {
    const claims = verifyRefreshToken(refreshToken);
    const user = await User.findById(claims.sub).select("+refreshTokenHash");
    if (!user?.refreshTokenHash || !(await compareToken(refreshToken, user.refreshTokenHash))) {
      throw new AppError(401, "REFRESH_INVALID", "Your session has expired. Please log in again.");
    }
    await persistSession(user, res);
    return toPublicUser(user);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, "REFRESH_INVALID", "Your session has expired. Please log in again.");
  }
}

export async function logout(req: Request, res: Response) {
  if (isDatabaseReady() && req.user) {
    req.user.refreshTokenHash = null;
    await req.user.save();
  }
  clearSessionCookies(res);
}

export async function forgotPassword(email: string) {
  ensureDatabase();
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+resetPasswordHash +resetPasswordExpiresAt",
  );
  if (!user) {
    return { message: "If an account exists, password reset instructions have been prepared." };
  }
  const rawToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordHash = await hashToken(rawToken);
  user.resetPasswordExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  return {
    message: "If an account exists, password reset instructions have been prepared.",
    ...(env.NODE_ENV === "development" ? { resetToken: rawToken } : {}),
  };
}

export async function resetPassword(
  email: string,
  token: string,
  password: string,
  res: Response,
) {
  ensureDatabase();
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash +resetPasswordHash +resetPasswordExpiresAt",
  );
  if (
    !user?.resetPasswordHash ||
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt.getTime() < Date.now() ||
    !(await compareToken(token, user.resetPasswordHash))
  ) {
    throw new AppError(400, "RESET_INVALID", "That password reset link is invalid or has expired.");
  }
  user.passwordHash = await hashPassword(password);
  user.resetPasswordHash = null;
  user.resetPasswordExpiresAt = null;
  await persistSession(user, res);
  return toPublicUser(user);
}