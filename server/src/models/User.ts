import { Schema, model, type HydratedDocument } from "mongoose";
import { USER_ROLES, type PublicUser, type UserRole } from "@abuja-messenger/contracts";

export interface UserDocument {
  name: string;
  username: string;
  email: string;
  phone?: string | null;
  passwordHash?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  authProviders: string[];
  refreshTokenHash?: string | null;
  resetPasswordHash?: string | null;
  resetPasswordExpiresAt?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  riderVerificationStatus?: "active" | "suspended" | null;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
      match: /^[a-z0-9_.]+$/,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: null },
    passwordHash: { type: String, default: null, select: false },
    role: { type: String, enum: USER_ROLES, default: "customer", index: true },
    avatarUrl: { type: String, default: null },
    authProviders: { type: [String], default: ["local"] },
    refreshTokenHash: { type: String, default: null, select: false },
    resetPasswordHash: { type: String, default: null, select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
    lastLoginAt: { type: Date, default: null },
    riderVerificationStatus: {
      type: String,
      enum: ["active", "suspended", null],
      default: null,
    },
  },
  { timestamps: true },
);

export type UserHydrated = HydratedDocument<UserDocument>;
export const User = model<UserDocument>("User", userSchema);

export function toPublicUser(
  user: UserHydrated | (UserDocument & { _id: unknown }),
): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
  };
}