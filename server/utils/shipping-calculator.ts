/**
 * Shipping Fee Calculator
 * Calculates shipping fees based on seller and buyer locations
 * Realistic Philippine shipping rates (similar to J&T, LBC, JRS)
 */

export interface ShippingRate {
  fee: number;
  minimumOrder: number;
  estimatedDays: string;
  zone: string;
  zoneName: string;
}

export interface ShippingCalculation {
  fee: number;
  minimumOrder: number;
  meetsMinimum: boolean;
  estimatedDays: string;
  zone: string;
  zoneName: string;
}

// Realistic Philippine shipping rates (no minimum order required)
const SHIPPING_RATES: Record<string, ShippingRate> = {
  // Same city/municipality - cheapest, fastest
  same_city: {
    fee: 39,
    minimumOrder: 0, // No minimum
    estimatedDays: "1-2 days",
    zone: "same_city",
    zoneName: "Same City",
  },

  // Same province - moderate pricing
  same_province: {
    fee: 49,
    minimumOrder: 0, // No minimum
    estimatedDays: "2-3 days",
    zone: "same_province",
    zoneName: "Same Province",
  },

  // Within Central Luzon (Region III)
  central_luzon: {
    fee: 58,
    minimumOrder: 0, // No minimum
    estimatedDays: "2-4 days",
    zone: "central_luzon",
    zoneName: "Central Luzon",
  },

  // Metro Manila / NCR
  metro_manila: {
    fee: 58,
    minimumOrder: 0, // No minimum
    estimatedDays: "2-4 days",
    zone: "metro_manila",
    zoneName: "Metro Manila",
  },

  // Other Luzon provinces
  other_luzon: {
    fee: 85,
    minimumOrder: 0, // No minimum
    estimatedDays: "3-5 days",
    zone: "other_luzon",
    zoneName: "Other Luzon",
  },

  // Visayas region
  visayas: {
    fee: 120,
    minimumOrder: 0, // No minimum
    estimatedDays: "5-7 days",
    zone: "visayas",
    zoneName: "Visayas",
  },

  // Mindanao region
  mindanao: {
    fee: 150,
    minimumOrder: 0, // No minimum
    estimatedDays: "5-7 days",
    zone: "mindanao",
    zoneName: "Mindanao",
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

  // Same city check
  const sellerCity = extractCity(sellerLower);
  const buyerCity = extractCity(buyerLower);
  if (sellerCity && buyerCity && sellerCity === buyerCity) {
    return "same_city";
  }

  // Same province check
  const sellerProvince = extractProvince(sellerLower);
  const buyerProvince = extractProvince(buyerLower);
  if (sellerProvince && buyerProvince && sellerProvince === buyerProvince) {
    return "same_province";
  }

  // Check buyer location for region
  // Metro Manila
  if (matchesAny(buyerLower, METRO_MANILA_AREAS)) {
    return "metro_manila";
  }

  // Central Luzon - both seller and buyer
  const sellerInCL = matchesAny(sellerLower, CENTRAL_LUZON_PROVINCES);
  const buyerInCL = matchesAny(buyerLower, CENTRAL_LUZON_PROVINCES);
  if (sellerInCL && buyerInCL) {
    return "central_luzon";
  }

  // Visayas
  if (matchesAny(buyerLower, VISAYAS_PROVINCES)) {
    return "visayas";
  }

  // Mindanao
  if (matchesAny(buyerLower, MINDANAO_PROVINCES)) {
    return "mindanao";
  }

  // Default to other Luzon
  return "other_luzon";
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

