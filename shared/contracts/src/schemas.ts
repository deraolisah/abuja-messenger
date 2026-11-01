// shared/contracts/src/schemas.ts
import { z } from "zod";

export const registerInputSchema = z.object({
  displayName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().min(7).max(20).optional(),
});

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordInputSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordInputSchema = z.object({
  email: z.string().email(),
  token: z.string().min(10),
  password: z.string().min(8).max(100),
});

export type RegisterInputZ = z.infer<typeof registerInputSchema>;
export type LoginInputZ = z.infer<typeof loginInputSchema>;