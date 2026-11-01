import {
  VEHICLE_SEEDS,
  type DeliveryType,
  type VehicleSlug,
} from "@abuja-messenger/contracts";

/**
 * DEMO ONLY: approximate district centres + straight-line distance.
 * In production the server calculates the fare (Google Distance Matrix /
 * Mapbox Directions) and the client only displays what the API returns.
 */
export const DISTRICTS = [
  { name: "Central Area", lat: 9.0561, lng: 7.4891 },
  { name: "Wuse", lat: 9.0643, lng: 7.4892 },
  { name: "Wuse 2", lat: 9.0765, lng: 7.473 },
  { name: "Garki", lat: 9.036, lng: 7.486 },
  { name: "Maitama", lat: 9.091, lng: 7.493 },
  { name: "Asokoro", lat: 9.045, lng: 7.53 },
  { name: "Jabi", lat: 9.068, lng: 7.425 },
  { name: "Utako", lat: 9.072, lng: 7.44 },
  { name: "Wuye", lat: 9.07, lng: 7.46 },
  { name: "Life Camp", lat: 9.09, lng: 7.4 },
  { name: "Gwarinpa", lat: 9.11, lng: 7.4 },
  { name: "Kubwa", lat: 9.156, lng: 7.33 },
  { name: "Apo", lat: 8.998, lng: 7.5 },
  { name: "Lokogoma", lat: 8.95, lng: 7.46 },
  { name: "Lugbe", lat: 8.983, lng: 7.383 },
  { name: "Nyanya", lat: 9.014, lng: 7.58 },
  { name: "Karu", lat: 9.009, lng: 7.6 },
] as const;

export const DELIVERY_TYPE_META: Record<
  DeliveryType,
  { label: string; blurb: string; multiplier: number; pickupMinutes: number }
> = {
  same_day: {
    label: "Standard",
    blurb: "Picked up within the hour, delivered same day.",
    multiplier: 1,
    pickupMinutes: 20,
  },
  express: {
    label: "Express",
    blurb: "Nearest rider, straight to you. No other stops.",
    multiplier: 1.4,
    pickupMinutes: 8,
  },
  scheduled: {
    label: "Scheduled",
    blurb: "Pick a date and time. Cheaper when you plan ahead.",
    multiplier: 0.9,
    pickupMinutes: 0,
  },
};

export function getVehicle(slug: VehicleSlug) {
  const vehicle = VEHICLE_SEEDS.find((v) => v.slug === slug);
  if (!vehicle) throw new Error(`Unknown vehicle: ${slug}`);
  return vehicle;
}

const ROAD_FACTOR = 1.35; // roads are never straight

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function routeDistanceKm(from: string, to: string): number | null {
  const a = DISTRICTS.find((d) => d.name === from);
  const b = DISTRICTS.find((d) => d.name === to);
  if (!a || !b) return null;
  if (a.name === b.name) return 2;
  const km = haversineKm(a.lat, a.lng, b.lat, b.lng) * ROAD_FACTOR;
  return Math.max(2, Math.round(km * 10) / 10);
}

export function estimateFare(input: {
  vehicle: VehicleSlug;
  distanceKm: number;
  deliveryType: DeliveryType;
}) {
  const v = getVehicle(input.vehicle);
  const meta = DELIVERY_TYPE_META[input.deliveryType];
  const raw = v.baseFareKobo + v.pricePerKmKobo * input.distanceKm;
  const adjusted = Math.max(raw, v.minimumFareKobo) * meta.multiplier;
  const fareKobo = Math.round(adjusted / 5000) * 5000; // nearest ₦50
  const etaMinutes = Math.round(
    meta.pickupMinutes + (input.distanceKm / v.estimatedSpeedKph) * 60,
  );
  return { fareKobo, etaMinutes };
}

export function formatNaira(kobo: number) {
  return `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Set VITE_DEMO_MODE=true in client/.env to run the pages without a backend. */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export function makeDemoCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "AM-";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}