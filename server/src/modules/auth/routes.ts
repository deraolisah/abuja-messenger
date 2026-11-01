import { Router } from "express";

import {
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
} from "@abuja-messenger/contracts";

import { resolveAuth, getRequestUser, requireAuth } from "../../middleware/auth.ts";
import { validateBody } from "../../middleware/validate.ts";
import { asyncRoute } from "../../routes/asyncRoute.ts";
import {
  clearSessionCookies,
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  resetPassword,
} from "./service.js";

export const authRouter: ReturnType<typeof Router> = Router();
authRouter.use(resolveAuth);

authRouter.get("/me", (req, res) => {
  res.json({ user: getRequestUser(req) });
});

authRouter.post(
  "/register",
  validateBody(registerInputSchema),
  asyncRoute(async (req, res) => {
    const { displayName, email, phone, password } = req.body as {
      displayName: string;
      email: string;
      phone?: string;
      password: string;
    };
    const user = await register(
      { displayName, email, ...(phone ? { phone } : {}) },
      password,
      res,
    );
    res.status(201).json({ user });
  }),
);

authRouter.post(
  "/login",
  validateBody(loginInputSchema),
  asyncRoute(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const user = await login(email, password, res);
    res.json({ user });
  }),
);

authRouter.post(
  "/refresh",
  asyncRoute(async (req, res) => {
    const user = await refresh(req.cookies?.am_refresh_token, res);
    res.json({ user });
  }),
);

authRouter.post(
  "/logout",
  asyncRoute(async (req, res) => {
    await logout(req, res);
    clearSessionCookies(res);
    res.status(204).send();
  }),
);

authRouter.post(
  "/forgot-password",
  validateBody(forgotPasswordInputSchema),
  asyncRoute(async (req, res) => {
    const { email } = req.body as { email: string };
    res.json(await forgotPassword(email));
  }),
);

authRouter.post(
  "/reset-password",
  validateBody(resetPasswordInputSchema),
  asyncRoute(async (req, res) => {
    const { email, token, password } = req.body as {
      email: string;
      token: string;
      password: string;
    };
    const user = await resetPassword(email, token, password, res);
    res.json({ user });
  }),
);

authRouter.get("/protected-check", requireAuth, (req, res) => {
  res.json({ user: getRequestUser(req) });
});