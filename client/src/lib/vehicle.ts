// Prices are in kobo (₦1 = 100 kobo). The 3-wheeler and van numbers are
// placeholders — confirm real rates with the owner before the demo.
export const VEHICLE_SEEDS = [
  {
    slug: "two-wheeler",
    name: "2 Wheeler",
    description: "The nimble choice for documents, meals, and everyday parcels.",
    maxWeightKg: 15,
    maxLengthCm: 50,
    maxWidthCm: 40,
    maxHeightCm: 40,
    baseFareKobo: 180000,
    pricePerKmKobo: 6500,
    minimumFareKobo: 250000,
    estimatedSpeedKph: 28,
    active: true,
  },
  {
    slug: "three-wheeler",
    name: "3 Wheeler",
    description: "Covered cargo keke for bulkier boxes, groceries, and small furniture.",
    maxWeightKg: 150,
    maxLengthCm: 100,
    maxWidthCm: 80,
    maxHeightCm: 90,
    baseFareKobo: 350000,
    pricePerKmKobo: 9000,
    minimumFareKobo: 500000,
    estimatedSpeedKph: 22,
    active: true,
  },
  {
    slug: "mini-van",
    name: "Mini van",
    description: "Room for heavy loads, multiple boxes, and house moves.",
    maxWeightKg: 800,
    maxLengthCm: 200,
    maxWidthCm: 130,
    maxHeightCm: 120,
    baseFareKobo: 900000,
    pricePerKmKobo: 14000,
    minimumFareKobo: 1500000,
    estimatedSpeedKph: 30,
    active: true,
  },
] as const;

export type VehicleSeed = (typeof VEHICLE_SEEDS)[number];
export type VehicleSlug = VehicleSeed["slug"];