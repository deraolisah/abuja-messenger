// server/src/models/Vehicle.ts
import { Schema, model, type InferSchemaType } from "mongoose";

import { VEHICLE_SEEDS } from "@abuja-messenger/contracts";

const VehicleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, enum: VEHICLE_SEEDS.map((v) => v.slug) },
    name: { type: String, required: true },
    description: { type: String, required: true },
    maxWeightKg: { type: Number, required: true },
    maxLengthCm: { type: Number, required: true },
    maxWidthCm: { type: Number, required: true },
    maxHeightCm: { type: Number, required: true },
    baseFareKobo: { type: Number, required: true },
    pricePerKmKobo: { type: Number, required: true },
    minimumFareKobo: { type: Number, required: true },
    estimatedSpeedKph: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type VehicleDoc = InferSchemaType<typeof VehicleSchema>;

export const Vehicle = model("Vehicle", VehicleSchema);