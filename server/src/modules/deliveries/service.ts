// server/src/modules/deliveries/service.ts
import { AppError } from "../../middleware/errors.js";
import { Delivery } from "../../models/Delivery.js";
// import { Vehicle } from "../../models/Vehicle.js";
import type { TrackingSnapshot } from "@abuja-messenger/contracts";

export async function getTrackingSnapshot(trackingCode: string): Promise<TrackingSnapshot> {
  const d = await Delivery.findOne({ trackingCode }).lean();
  if (!d) throw new AppError(404, "NOT_FOUND", "We couldn't find that tracking code.");

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
    events: d.events.map((e): TrackingSnapshot["events"][number] => {
      const event: TrackingSnapshot["events"][number] = {
        status: e.status,
        at: new Date(e.at).toISOString(),
        ...(typeof e.note === "string" ? { note: e.note } : {}),
      };
      return event;
    }),
  };
}

// Real implementation comes later — for now keep the honest 503
export async function createDelivery(_input: unknown): Promise<never> {
  throw new AppError(
    503,
    "NOT_LIVE",
    "Booking isn't live yet. Payments and dispatch are the next phase.",
  );
}