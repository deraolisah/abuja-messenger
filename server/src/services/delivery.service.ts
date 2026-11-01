// apps/api/src/services/delivery.service.ts
import type { TrackingSnapshot } from "../../../client/src/lib/tracking";

import { NotFound, ServiceUnavailable } from "../lib/errors";
import { Delivery } from "../models/Delivery";

/**
 * Phase 1: booking is NOT implemented. We return a truthful 503 so the client
 * shows an error instead of a fake success.
 */
export async function createDelivery(_input: unknown): Promise<never> {
  throw ServiceUnavailable(
    "Booking isn't live yet. Payments and dispatch are the next phase.",
  );
}

/**
 * Tracking: return a real snapshot if the delivery exists, else 404.
 * The `TrackPage` consumes this exact shape — wire it as-is.
 */
export async function getTrackingSnapshot(
  trackingCode: string,
): Promise<TrackingSnapshot> {
  const d = await Delivery.findOne({ trackingCode }).lean();
  if (!d) throw NotFound("We couldn't find that tracking code.");

  return {
    trackingCode: d.trackingCode,
    status: d.status,
    deliveryType: d.deliveryType,
    vehicleSlug: d.vehicleSlug as TrackingSnapshot["vehicleSlug"],
    pickup: { district: d.pickup.district, address: d.pickup.address },
    dropoff: {
      district: d.dropoff.district,
      address: d.dropoff.address,
      recipientName: d.dropoff.name,
    },
    distanceKm: d.distanceKm ?? 0,
    fareKobo: d.fareKobo ?? 0,
    etaMinutes: d.etaMinutes ?? null,
    handoverPin: d.handoverPin,
    rider: d.rider
      ? {
          name: d.rider.name ?? "",
          phone: d.rider.phone ?? "",
          plate: d.rider.plate ?? "",
          rating: d.rider.rating ?? 5,
        }
      : null,
    events: d.events.map((e) => ({
      status: e.status,
      at: new Date(e.at).toISOString(),
      note: e.note,
    })),
  };
}