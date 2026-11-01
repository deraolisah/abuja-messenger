// apps/api/src/routes/auth.ts
import { Router } from "express";
import { z } from "zod";

import { isProd, env } from "../env";
import { ServiceUnavailable } from "../lib/errors";
import { asyncHandler } from "../lib/http";
import { requireAuth } from "../middleware/auth";
import { isDbConnected } from "../config/database";
import * as authService from "../services/auth.service";

export const authRouter = Router();

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd || env.COOKIE_SECURE === true,
  domain: env.COOKIE_DOMAIN,
  path: "/",
};

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(2).max(80),
  phone: z.string().min(7).max(20).optional(),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const ForgotBody = z.object({ email: z.string().email() });
const ResetBody = z.object({ token: z.string().min(10), password: z.string().min(8).max(100) });

function assertDb() {
  if (!isDbConnected()) {
    throw ServiceUnavailable("Database not configured. Account actions are disabled.");
  }
}

function setAuthCookies(res: import("express").Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie("am_access", tokens.accessToken, { ...cookieOpts, maxAge: 15 * 60_000 });
  res.cookie("am_refresh", tokens.refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60_000 });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    assertDb();
    const body = RegisterBody.parse(req.body);
    const { user, tokens } = await authService.register(body);
    setAuthCookies(res, tokens);
    res.status(201).json({ user });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    assertDb();
    const body = LoginBody.parse(req.body);
    const { user, tokens } = await authService.login(body);
    setAuthCookies(res, tokens);
    res.json({ user });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    // The actual refresh logic lives in the auth service; for phase 1 we simply
    // re-verify the refresh cookie and mint a new access token.
    const refresh = req.cookies?.["am_refresh"] as string | undefined;
    if (!refresh) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No refresh token." } });
    const { verifyRefreshToken, signAccessToken } = await import("../lib/jwt");
    const payload = verifyRefreshToken(refresh);
    const user = await authService.findById(payload.sub);
    const accessToken = signAccessToken(user.id, user.role);
    res.cookie("am_access", accessToken, { ...cookieOpts, maxAge: 15 * 60_000 });
    res.json({ user });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie("am_access", cookieOpts);
    res.clearCookie("am_refresh", cookieOpts);
    res.status(204).end();
  }),
);

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!isDbConnected()) return res.json({ user: null });
    const access = req.cookies?.["am_access"] as string | undefined;
    if (!access) return res.json({ user: null });

    try {
      const { verifyAccessToken } = await import("../lib/jwt");
      const payload = verifyAccessToken(access);
      const user = await authService.findById(payload.sub);
      return res.json({ user });
    } catch {
      return res.json({ user: null });
    }
  }),
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    assertDb();
    const body = ForgotBody.parse(req.body);
    await authService.issuePasswordReset(body.email);
    // Always 200 — never leak whether the account exists
    res.status(200).json({ ok: true });
  }),
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    assertDb();
    const body = ResetBody.parse(req.body);
    await authService.resetPassword(body.token, body.password);
    res.status(204).end();
  }),
);

authRouter.get(
  "/protected-check",
  requireAuth,
  (req, res) => {
    res.json({ ok: true, user: req.authUser });
  },
);