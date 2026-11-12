// server/src/models/RiderProfile.ts
import { Schema, model, type HydratedDocument, Types } from "mongoose";

export interface RiderProfileDocument {
  userId: Types.ObjectId;
  plateNumber: string;
  vehicleSlug: string;
  licenseNumber?: string | null;
  licenseExpiryAt?: Date | null;         // ← new: track license validity
  status: "active" | "suspended";        // ← rename from verificationStatus, narrower
  suspendedReason?: string | null;       // ← new: why (for UI + audit)
  createdBy: Types.ObjectId;             // ← who created this rider (admin)
  rating: number;
  totalDeliveries: number;
  createdAt: Date;
  updatedAt: Date;
}

const riderProfileSchema = new Schema<RiderProfileDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    plateNumber: { type: String, required: true, trim: true, uppercase: true },
    vehicleSlug: { type: String, required: true },
    licenseNumber: { type: String, default: null },
    licenseExpiryAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      index: true,
    },
    suspendedReason: { type: String, default: null },
    // statusHistory: [{ status, reason, at, by }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type RiderProfileHydrated = HydratedDocument<RiderProfileDocument>;
export const RiderProfile = model<RiderProfileDocument>("RiderProfile", riderProfileSchema);