import type {
  DeliveryStatus,
  DeliveryType,
  VehicleSlug,
} from "@abuja-messenger/contracts";

export type TrackingEvent = {
  status: DeliveryStatus;
  at: string; // ISO date
  note?: string;
};

/** Shape the API should return from GET /deliveries/track/:trackingCode */
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
  handoverPin: string; // recipient shares this with the rider on delivery
  rider: { name: string; phone: string; plate: string; rating: number } | null;
  events: TrackingEvent[];
};

/** The stages a customer actually cares about. */
export const TIMELINE_STEPS = [
  { key: "confirmed", label: "Booking confirmed", hint: "We have your details." },
  { key: "rider_assigned", label: "Rider assigned", hint: "Your rider is heading to pickup." },
  { key: "package_picked_up", label: "Package picked up", hint: "On the road with your item." },
  { key: "in_transit", label: "On the way", hint: "Heading to the drop-off." },
  { key: "delivered", label: "Delivered", hint: "Handed to the recipient." },
] as const;

/** Which timeline step a given status belongs to (-1 = not started). */
export function stepIndexFor(status: DeliveryStatus): number {
  switch (status) {
    case "pending_payment":
      return -1;
    case "confirmed":
    case "searching_for_rider":
      return 0;
    case "rider_assigned":
    case "rider_arriving":
      return 1;
    case "package_picked_up":
      return 2;
    case "in_transit":
    case "near_destination":
      return 3;
    case "delivered":
      return 4;
    default:
      return -1;
  }
}

/** 0–1 position of the rider along the pickup → drop-off route. */
export function routeProgressFor(status: DeliveryStatus): number {
  switch (status) {
    case "package_picked_up":
      return 0.06;
    case "in_transit":
      return 0.5;
    case "near_destination":
      return 0.88;
    case "delivered":
      return 1;
    default:
      return 0;
  }
}

/* ----------------------------- demo data ----------------------------- */

export const DEMO_SEQUENCE: DeliveryStatus[] = [
  "confirmed",
  "searching_for_rider",
  "rider_assigned",
  "rider_arriving",
  "package_picked_up",
  "in_transit",
  "near_destination",
  "delivered",
];

const DEMO_NOTES: Partial<Record<DeliveryStatus, string>> = {
  confirmed: "Payment received",
  searching_for_rider: "Looking for the nearest rider",
  rider_assigned: "Musa is on the job",
  rider_arriving: "Rider is minutes from pickup",
  package_picked_up: "Item collected and checked",
  in_transit: "Heading to the drop-off",
  near_destination: "Rider is close by",
  delivered: "Handed over with PIN",
};

const DEMO_ETA: Partial<Record<DeliveryStatus, number | null>> = {
  confirmed: 35,
  searching_for_rider: 32,
  rider_assigned: 28,
  rider_arriving: 24,
  package_picked_up: 20,
  in_transit: 12,
  near_destination: 3,
  delivered: null,
};

export function buildDemoSnapshot(
  trackingCode: string,
  stage: number,
  startedAt: number,
): TrackingSnapshot {
  const i = Math.min(Math.max(stage, 0), DEMO_SEQUENCE.length - 1);
  const status = DEMO_SEQUENCE[i];
  const hasRider = i >= DEMO_SEQUENCE.indexOf("rider_assigned");

  return {
    trackingCode,
    status,
    deliveryType: "express",
    vehicleSlug: "two-wheeler",
    pickup: { district: "Wuse 2", address: "Plot 14, Aminu Kano Crescent" },
    dropoff: {
      district: "Gwarinpa",
      address: "3rd Avenue, Block 22",
      recipientName: "Amina Bello",
    },
    distanceKm: 14.2,
    fareKobo: 395000,
    etaMinutes: DEMO_ETA[status] ?? null,
    handoverPin: "4821",
    rider: hasRider
      ? { name: "Musa Ibrahim", phone: "+2348012345678", plate: "ABJ 482 KE", rating: 4.9 }
      : null,
    events: DEMO_SEQUENCE.slice(0, i + 1).map((s, idx) => ({
      status: s,
      at: new Date(startedAt + idx * 4 * 60_000).toISOString(),
      note: DEMO_NOTES[s],
    })),
  };
}