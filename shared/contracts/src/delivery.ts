// shared/contracts/src/delivery.ts 
import type { VehicleSlug } from "./vehicle.js";   

export const DELIVERY_STATUSES = [
  "pending_payment",
  "confirmed",
  "searching_for_rider",
  "rider_assigned",
  "rider_arriving",
  "package_picked_up",
  "in_transit",
  "near_destination",
  "delivered",
  "cancelled",
  "failed",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const DELIVERY_TYPES = ["same_day", "express", "scheduled"] as const;
export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending_payment: "Payment pending",
  confirmed: "Confirmed",
  searching_for_rider: "Finding a rider",
  rider_assigned: "Rider assigned",
  rider_arriving: "Rider arriving",
  package_picked_up: "Package picked up",
  in_transit: "In transit",
  near_destination: "Nearly there",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Delivery issue",
};

export type TrackingEvent = {
  status: DeliveryStatus;
  at: string;
  note?: string;
};

export type TrackingSnapshot = {
  trackingCode: string;
  status: DeliveryStatus;
  deliveryType: DeliveryType;
  vehicleSlug: VehicleSlug;
  pickup: { district: string; address: string };
  dropoff: { district: string; address: string; recipientName: string };
  distanceKm: number;
  fareKobo: number;
  etaMinutes: number | null;
  handoverPin: string;
  rider: { name: string; phone: string; plate: string; rating: number } | null;
  events: TrackingEvent[];
};