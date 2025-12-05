/**
 * Location Filter Utility
 * Filters products based on proximity to buyer location
 */

import { determineShippingZone } from "./shipping-calculator";

// Zones considered "near" for filtering - includes direct same-city delivery
const NEAR_ZONES = ["direct", "same_city", "same_province", "central_luzon", "metro_manila", "other_luzon"];

/**
 * Check if seller location is "near" buyer location
 * Returns true if they are in the same major region (Luzon, Visayas, or Mindanao)
 */
export function isNearby(sellerLocation: string, buyerLocation: string): boolean {
  if (!sellerLocation || !buyerLocation) {
    return true; // If no location data, don't filter out
  }

  const zone = determineShippingZone(sellerLocation, buyerLocation);
  
  // Always consider direct (same-city) as nearby for any region
  if (zone === "direct") {
    return true;
  }

  // For Visayas buyers, consider Visayas as near
  if (isInVisayas(buyerLocation)) {
    return zone === "direct" || zone === "same_city" || zone === "same_province" || zone === "visayas";
  }
  
  // For Mindanao buyers, consider Mindanao as near
  if (isInMindanao(buyerLocation)) {
    return zone === "direct" || zone === "same_city" || zone === "same_province" || zone === "mindanao";
  }
  
  // For Luzon buyers (default)
  return NEAR_ZONES.includes(zone);
}

/**
 * Check if location is in Visayas region
 */
function isInVisayas(location: string): boolean {
  const visayasProvinces = [
    "cebu", "bohol", "iloilo", "negros", "leyte", "samar", "panay",
    "aklan", "antique", "capiz", "guimaras", "siquijor", "biliran",
    "southern leyte", "eastern samar", "northern samar", "western samar"
  ];
  const lower = location.toLowerCase();
  return visayasProvinces.some(province => lower.includes(province));
}

/**
 * Check if location is in Mindanao region
 */
function isInMindanao(location: string): boolean {
  const mindanaoProvinces = [
    "davao", "zamboanga", "cagayan de oro", "general santos", "cotabato",
    "bukidnon", "misamis", "lanao", "surigao", "agusan", "basilan", "sulu",
    "tawi-tawi", "sarangani", "sultan kudarat", "maguindanao", "compostela valley",
    "davao del norte", "davao del sur", "davao oriental", "south cotabato", "north cotabato"
  ];
  const lower = location.toLowerCase();
  return mindanaoProvinces.some(province => lower.includes(province));
}

/**
 * For more granular control, return the zone type
 */
export function getProximityZone(sellerLocation: string, buyerLocation: string): string {
  return determineShippingZone(sellerLocation, buyerLocation);
}

