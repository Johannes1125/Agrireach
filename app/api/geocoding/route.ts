import { NextRequest } from "next/server";
import { jsonOk, jsonError, requireMethod } from "@/server/utils/api";
import {
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  formatPhilippineAddressForGeocoding,
  Coordinates,
} from "@/server/utils/geocoding";

export async function GET(req: NextRequest) {
  const mm = requireMethod(req, ["GET"]);
  if (mm) return mm;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const address = searchParams.get("address");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const region = searchParams.get("region");
  const province = searchParams.get("province");
  const city = searchParams.get("city");
  const barangay = searchParams.get("barangay");
  const streetAddress = searchParams.get("streetAddress");

  try {
    // Geocode action: address to coordinates
    if (action === "geocode") {
      let addressToGeocode = address;

      // If Philippine address components are provided, format them
      if (region || province || city || barangay || streetAddress) {
        addressToGeocode = formatPhilippineAddressForGeocoding(
          region || undefined,
          province || undefined,
          city || undefined,
          barangay || undefined,
          streetAddress || undefined
        );
      }

      if (!addressToGeocode) {
        return jsonError("Address is required for geocoding", 400);
      }

      const result = await geocodeAddress(addressToGeocode);

      if (!result) {
        return jsonError("Address not found", 404);
      }

      return jsonOk({
        address: result.address,
        coordinates: result.coordinates,
        formatted_address: result.formatted_address,
      });
    }

    // Reverse geocode action: coordinates to address
    if (action === "reverse") {
      if (!lat || !lng) {
        return jsonError("Latitude and longitude are required", 400);
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (isNaN(latitude) || isNaN(longitude)) {
        return jsonError("Invalid coordinates", 400);
      }

      const result = await reverseGeocode(latitude, longitude);

      if (!result) {
        return jsonError("Location not found", 404);
      }

      return jsonOk({
        address: result.address,
        coordinates: result.coordinates,
        formatted_address: result.formatted_address,
        city: result.city,
        state: result.state,
        postal_code: result.postal_code,
        country: result.country,
      });
    }

    // Calculate distance action
    if (action === "distance") {
      const lat1 = searchParams.get("lat1");
      const lng1 = searchParams.get("lng1");
      const lat2 = searchParams.get("lat2");
      const lng2 = searchParams.get("lng2");

      if (!lat1 || !lng1 || !lat2 || !lng2) {
        return jsonError("All coordinates are required for distance calculation", 400);
      }

      const coord1: Coordinates = {
        latitude: parseFloat(lat1),
        longitude: parseFloat(lng1),
      };

      const coord2: Coordinates = {
        latitude: parseFloat(lat2),
        longitude: parseFloat(lng2),
      };

      if (
        isNaN(coord1.latitude) ||
        isNaN(coord1.longitude) ||
        isNaN(coord2.latitude) ||
        isNaN(coord2.longitude)
      ) {
        return jsonError("Invalid coordinates", 400);
      }

      const distance = calculateDistance(coord1, coord2);

      return jsonOk({
        distance_km: distance,
        distance_miles: distance * 0.621371,
      });
    }

    return jsonError("Invalid action. Use 'geocode', 'reverse', or 'distance'", 400);
  } catch (error: any) {
    console.error("Geocoding API error:", error);
    return jsonError(error.message || "Geocoding failed", 500);
  }
}

