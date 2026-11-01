// apps/api/src/services/auth.service.ts
import type { PublicUser, UserRole } from "@abuja-messenger/contracts";

import { BadRequest, Conflict, NotFound, Unauthorized } from "../lib/errors";
import {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyResetToken,
} from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";
import { User } from "../models/User";

export type AuthTokens = { accessToken: string; refreshToken: string };

function toPublicUser(u: {
  _id: unknown;
  email: string;
  displayName: string;
  role: string;
}): PublicUser {
  return {
    id: String(u._id),
    email: u.email,
    displayName: u.displayName,
    role: u.role as UserRole,
  };
}

export async function register(input: {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}) {
  const exists = await User.findOne({ email: input.email.toLowerCase() }).lean();
  if (exists) throw Conflict("An account with that email already exists.");

  const user = await User.create({
    email: input.email,
    displayName: input.displayName,
    phone: input.phone,
    role: "customer" as UserRole,
    passwordHash: await hashPassword(input.password),
  });

  return {
    user: toPublicUser(user),
    tokens: {
      accessToken: signAccessToken(String(user._id), user.role),
      refreshToken: signRefreshToken(String(user._id)),
    } satisfies AuthTokens,
  };
}

export async function login(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select("+passwordHash");
  if (!user) throw Unauthorized("Email or password is incorrect.");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw Unauthorized("Email or password is incorrect.");

  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: toPublicUser(user),
    tokens: {
      accessToken: signAccessToken(String(user._id), user.role),
      refreshToken: signRefreshToken(String(user._id)),
    } satisfies AuthTokens,
  };
}

export async function findById(id: string) {
  const user = await User.findById(id).lean();
  if (!user) throw NotFound("Account not found.");
  return toPublicUser(user);
}

export async function issuePasswordReset(email: string) {
  // Always respond the same regardless of existence — don't leak accounts
  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return { delivered: false as const };

  const token = signResetToken(String(user._id));
  // TODO Phase 2: send email via provider (Resend/Postmark/SendGrid)
  console.info(`🔑 [dev] password reset token for ${email}: ${token}`);
  return { delivered: true as const };
}

export async function resetPassword(token: string, newPassword: string) {
  const payload = verifyResetToken(token);
  const user = await User.findById(payload.sub);
  if (!user) throw BadRequest("Reset link is no longer valid.");

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}