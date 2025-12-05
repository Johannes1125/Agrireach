/**
 * Shipping Fee Calculator
 * Calculates shipping fees based on seller and buyer locations
 * Optimized Philippine shipping rates for local agricultural commerce
 */

export interface ShippingRate {
  fee: number;
  minimumOrder: number;
  estimatedDays: string;
  zone: string;
  zoneName: string;
  isDirectDelivery?: boolean; // True if no hub routing needed
}

export interface ShippingCalculation {
  fee: number;
  minimumOrder: number;
  meetsMinimum: boolean;
  estimatedDays: string;
  zone: string;
  zoneName: string;
  isDirectDelivery: boolean;
}

// Delivery type for routing decisions
export type DeliveryType = "direct" | "single_hub" | "hub_to_hub";

// Optimized Philippine shipping rates (lower prices for local commerce)
const SHIPPING_RATES: Record<string, ShippingRate> = {
  // DIRECT DELIVERY - Same city, no hub needed, rider goes directly
  direct: {
    fee: 15,
    minimumOrder: 0,
    estimatedDays: "Same day - 1 day",
    zone: "direct",
    zoneName: "Direct Delivery (Same City)",
    isDirectDelivery: true,
  },

  // Same city but different area (fallback if direct not available)
  same_city: {
    fee: 20,
    minimumOrder: 0,
    estimatedDays: "1 day",
    zone: "same_city",
    zoneName: "Same City",
    isDirectDelivery: true,
  },

  // Same province, different city - single hub routing
  same_province: {
    fee: 29,
    minimumOrder: 0,
    estimatedDays: "1-2 days",
    zone: "same_province",
    zoneName: "Same Province",
    isDirectDelivery: false,
  },

  // Within Central Luzon (Region III)
  central_luzon: {
    fee: 39,
    minimumOrder: 0,
    estimatedDays: "2-3 days",
    zone: "central_luzon",
    zoneName: "Central Luzon",
    isDirectDelivery: false,
  },

  // Metro Manila / NCR
  metro_manila: {
    fee: 39,
    minimumOrder: 0,
    estimatedDays: "2-3 days",
    zone: "metro_manila",
    zoneName: "Metro Manila",
    isDirectDelivery: false,
  },

  // Other Luzon provinces
  other_luzon: {
    fee: 49,
    minimumOrder: 0,
    estimatedDays: "3-4 days",
    zone: "other_luzon",
    zoneName: "Other Luzon",
    isDirectDelivery: false,
  },

  // Visayas region
  visayas: {
    fee: 79,
    minimumOrder: 0,
    estimatedDays: "4-6 days",
    zone: "visayas",
    zoneName: "Visayas",
    isDirectDelivery: false,
  },

  // Mindanao region
  mindanao: {
    fee: 99,
    minimumOrder: 0,
    estimatedDays: "5-7 days",
    zone: "mindanao",
    zoneName: "Mindanao",
    isDirectDelivery: false,
  },
};

// Central Luzon provinces (Region III)
const CENTRAL_LUZON_PROVINCES = [
  "aurora",
  "bataan",
  "bulacan",
  "nueva ecija",
  "pampanga",
  "tarlac",
  "zambales",
];

// Metro Manila cities/municipalities
const METRO_MANILA_AREAS = [
  "manila",
  "quezon city",
  "makati",
  "pasig",
  "taguig",
  "mandaluyong",
  "san juan",
  "pasay",
  "parañaque",
  "paranaque",
  "las piñas",
  "las pinas",
  "muntinlupa",
  "marikina",
  "caloocan",
  "malabon",
  "navotas",
  "valenzuela",
  "pateros",
  "ncr",
  "metro manila",
];

// Visayas provinces
const VISAYAS_PROVINCES = [
  "cebu",
  "bohol",
  "iloilo",
  "negros",
  "leyte",
  "samar",
  "panay",
  "aklan",
  "antique",
  "capiz",
  "guimaras",
  "siquijor",
  "biliran",
  "southern leyte",
  "eastern samar",
  "northern samar",
  "western samar",
];

// Mindanao provinces
const MINDANAO_PROVINCES = [
  "davao",
  "zamboanga",
  "cagayan de oro",
  "general santos",
  "cotabato",
  "bukidnon",
  "misamis",
  "lanao",
  "surigao",
  "agusan",
  "basilan",
  "sulu",
  "tawi-tawi",
  "sarangani",
  "sultan kudarat",
  "maguindanao",
  "compostela valley",
  "davao del norte",
  "davao del sur",
  "davao oriental",
  "south cotabato",
  "north cotabato",
];

/**
 * Extract city from a location string
 */
function extractCity(location: string): string {
  const lower = location.toLowerCase().trim();
  
  // Common patterns: "City, Province" or "Barangay, City, Province"
  const parts = lower.split(",").map((p) => p.trim());
  
  // If multiple parts, first or second is usually the city
  if (parts.length >= 2) {
    // Check if first part looks like a barangay
    if (parts[0].includes("brgy") || parts[0].includes("barangay")) {
      return parts[1] || parts[0];
    }
    return parts[0];
  }
  
  return lower;
}

/**
 * Extract province from a location string
 */
function extractProvince(location: string): string {
  const lower = location.toLowerCase().trim();
  const parts = lower.split(",").map((p) => p.trim());
  
  // Province is usually last or second to last
  if (parts.length >= 2) {
    // Check for "Philippines" at the end
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes("philippines") || lastPart.includes("ph")) {
      return parts[parts.length - 2] || lastPart;
    }
    return lastPart;
  }
  
  return lower;
}

/**
 * Check if location matches any item in a list
 */
function matchesAny(location: string, list: string[]): boolean {
  const lower = location.toLowerCase();
  return list.some((item) => lower.includes(item.toLowerCase()));
}

/**
 * Determine the shipping zone based on seller and buyer locations
 * Now includes "direct" zone for same-city deliveries (cheapest, fastest)
 */
export function determineShippingZone(
  sellerLocation: string,
  buyerLocation: string
): string {
  if (!sellerLocation || !buyerLocation) {
    return "other_luzon"; // Default fallback
  }

  const sellerLower = sellerLocation.toLowerCase().trim();
  const buyerLower = buyerLocation.toLowerCase().trim();

  // Extract city and province
  const sellerCity = extractCity(sellerLower);
  const buyerCity = extractCity(buyerLower);
  const sellerProvince = extractProvince(sellerLower);
  const buyerProvince = extractProvince(buyerLower);

  // DIRECT DELIVERY: Same city = ₱15, no hub needed!
  if (sellerCity && buyerCity && sellerCity === buyerCity) {
    return "direct";
  }

  // Same province but different city = ₱29
  if (sellerProvince && buyerProvince && sellerProvince === buyerProvince) {
    return "same_province";
  }

  // Check buyer location for region
  // Metro Manila = ₱39
  if (matchesAny(buyerLower, METRO_MANILA_AREAS)) {
    return "metro_manila";
  }

  // Central Luzon - both seller and buyer = ₱39
  const sellerInCL = matchesAny(sellerLower, CENTRAL_LUZON_PROVINCES);
  const buyerInCL = matchesAny(buyerLower, CENTRAL_LUZON_PROVINCES);
  if (sellerInCL && buyerInCL) {
    return "central_luzon";
  }

  // Visayas = ₱79
  if (matchesAny(buyerLower, VISAYAS_PROVINCES)) {
    return "visayas";
  }

  // Mindanao = ₱99
  if (matchesAny(buyerLower, MINDANAO_PROVINCES)) {
    return "mindanao";
  }

  // Default to other Luzon = ₱49
  return "other_luzon";
}

/**
 * Determine the delivery type for logistics routing
 */
export function determineDeliveryType(
  sellerLocation: string,
  buyerLocation: string
): DeliveryType {
  const zone = determineShippingZone(sellerLocation, buyerLocation);
  
  // Direct delivery - same city, no hub needed
  if (zone === "direct" || zone === "same_city") {
    return "direct";
  }
  
  // Single hub - same province
  if (zone === "same_province") {
    return "single_hub";
  }
  
  // Hub to hub - different regions
  return "hub_to_hub";
}

/**
 * Calculate shipping fee based on locations and order subtotal
 */
export function calculateShippingFee(
  sellerLocation: string,
  buyerLocation: string,
  subtotal: number
): ShippingCalculation {
  const zone = determineShippingZone(sellerLocation, buyerLocation);
  const rate = SHIPPING_RATES[zone] || SHIPPING_RATES["other_luzon"];

  return {
    fee: rate.fee,
    minimumOrder: rate.minimumOrder,
    meetsMinimum: subtotal >= rate.minimumOrder,
    estimatedDays: rate.estimatedDays,
    zone: rate.zone,
    zoneName: rate.zoneName,
    isDirectDelivery: rate.isDirectDelivery || false,
  };
}

/**
 * Get all available shipping rates (for display purposes)
 */
export function getAllShippingRates(): ShippingRate[] {
  return Object.values(SHIPPING_RATES);
}

/**
 * Get shipping rate for a specific zone
 */
export function getShippingRate(zone: string): ShippingRate | null {
  return SHIPPING_RATES[zone] || null;
}

