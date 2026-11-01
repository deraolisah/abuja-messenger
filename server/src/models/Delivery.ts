// apps/api/src/models/Delivery.ts
import { Schema, model, type InferSchemaType } from "mongoose";

import { DELIVERY_STATUSES, DELIVERY_TYPES } from "@abuja-messenger/contracts";

const PartySchema = new Schema(
  {
    district: { type: String, required: true },
    address: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false },
);

const EventSchema = new Schema(
  {
    status: { type: String, enum: DELIVERY_STATUSES, required: true },
    at: { type: Date, required: true },
    note: { type: String },
  },
  { _id: false },
);

const RiderSnapshotSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    phone: String,
    plate: String,
    rating: Number,
  },
  { _id: false },
);

const DeliverySchema = new Schema(
  {
    trackingCode: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: DELIVERY_STATUSES, default: "pending_payment", index: true },
    deliveryType: { type: String, enum: DELIVERY_TYPES, required: true },
    vehicleSlug: { type: String, required: true },

    pickup: { type: PartySchema, required: true },
    dropoff: { type: PartySchema, required: true },
    package: {
      category: String,
      description: String,
      weightKg: Number,
      fragile: Boolean,
    },
    notes: String,

    distanceKm: Number,
    fareKobo: Number,
    etaMinutes: { type: Number, default: null },
    handoverPin: { type: String, required: true },

    rider: { type: RiderSnapshotSchema, default: null },
    events: { type: [EventSchema], default: [] },

    scheduledFor: { type: Date, default: null },
    paymentMethod: { type: String, enum: ["card", "transfer", "cash"], required: true },
  },
  { timestamps: true },
);

export type DeliveryDoc = InferSchemaType<typeof DeliverySchema>;

export const Delivery = model("Delivery", DeliverySchema);