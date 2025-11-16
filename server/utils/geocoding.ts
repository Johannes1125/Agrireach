import { connectToDatabase } from "@/server/lib/mongodb";

const NOMINATIM_BASE_URL = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";
const NOMINATIM_USER_AGENT = process.env.NOMINATIM_USER_AGENT || "AgriReach/1.0 (contact@agrireach.com)";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  address: string;
  coordinates: Coordinates;
  formatted_address?: string;
  // Structured address components from reverse geocoding
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// Simple in-memory cache (consider Redis for production)
const geocodeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheEntry {
  result: GeocodeResult;
  timestamp: number;
}

// Rate limiting: 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimitedRequest(url: string): Promise<any> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      "Accept": "application/json",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Geocode an address to coordinates
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address || address.trim().length === 0) {
    return null;
  }

  // Check cache
  const cacheKey = `geocode:${address.toLowerCase().trim()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    // Format address for Philippines
    const formattedAddress = address.includes("Philippines") 
      ? address 
      : `${address}, Philippines`;

    const encodedAddress = encodeURIComponent(formattedAddress);
    const url = `${NOMINATIM_BASE_URL}/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`;

    const data = await rateLimitedRequest(url);

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const coordinates: Coordinates = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };

    const geocodeResult: GeocodeResult = {
      address,
      coordinates,
      formatted_address: result.display_name,
    };

    // Cache result
    geocodeCache.set(cacheKey, {
      result: geocodeResult,
      timestamp: Date.now(),
    });

    return geocodeResult;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  // Check cache
  const cacheKey = `reverse:${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  try {
    const url = `${NOMINATIM_BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

    const data = await rateLimitedRequest(url);

    if (!data || !data.address) {
      return null;
    }

    const address = data.display_name || 
      `${data.address.road || ""} ${data.address.city || data.address.town || data.address.village || ""}, ${data.address.state || ""}, Philippines`.trim();

    // Extract structured address components from Nominatim response
    const addr = data.address;
    const city = addr.city || addr.town || addr.village || addr.municipality || "";
    // For Philippines, check region first (e.g., "Central Luzon"), then state, then province
    const state = addr.region || addr.state || addr.province || "";
    const postalCode = addr.postcode || "";
    const country = addr.country || "Philippines";

    const geocodeResult: GeocodeResult = {
      address,
      coordinates: { latitude, longitude },
      formatted_address: data.display_name,
      city: city || undefined,
      state: state || undefined,
      postal_code: postalCode || undefined,
      country: country || "Philippines",
    };

    // Cache result
    geocodeCache.set(cacheKey, {
      result: geocodeResult,
      timestamp: Date.now(),
    });

    return geocodeResult;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format Philippine address for better geocoding
 */
export function formatPhilippineAddressForGeocoding(
  region?: string,
  province?: string,
  city?: string,
  barangay?: string,
  streetAddress?: string
): string {
  const parts: string[] = [];
  
  if (streetAddress) parts.push(streetAddress);
  if (barangay) parts.push(barangay);
  if (city) parts.push(city);
  if (province) parts.push(province);
  if (region) parts.push(region);
  
  parts.push("Philippines");
  
  return parts.filter(Boolean).join(", ");
}

