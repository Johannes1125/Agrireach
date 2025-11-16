import { NextRequest } from "next/server";
import { requireMethod, jsonError, jsonOk, getAuthToken } from "@/server/utils/api";
import { verifyToken } from "@/server/utils/auth";
import { connectToDatabase } from "@/server/lib/mongodb";
import { getQuotation, LalamoveQuotationRequest, LalamoveError } from "@/lib/lalamove";
import { geocodeAddress } from "@/server/utils/geocoding";

export async function POST(req: NextRequest) {
  const mm = requireMethod(req, ["POST"]);
  if (mm) return mm;

  const token = getAuthToken(req, "access");
  if (!token) return jsonError("Unauthorized", 401);

  let decoded: any;
  try {
    decoded = verifyToken<any>(token, "access");
  } catch {
    return jsonError("Unauthorized", 401);
  }

  try {
    const body = await req.json();
    const { 
      pickupAddress, 
      pickupCoordinates,
      deliveryAddress, 
      deliveryCoordinates,
      serviceType = "MOTORCYCLE",
      specialRequests = [],
      item 
    } = body;

    if (!pickupAddress || !deliveryAddress) {
      return jsonError("Pickup and delivery addresses are required", 400);
    }

    await connectToDatabase();

    // Get coordinates if not provided
    let pickupCoords = pickupCoordinates;
    let deliveryCoords = deliveryCoordinates;

    if (!pickupCoords) {
      const pickupGeocode = await geocodeAddress(pickupAddress);
      if (!pickupGeocode?.coordinates) {
        return jsonError("Could not geocode pickup address", 400);
      }
      pickupCoords = pickupGeocode.coordinates;
    }

    if (!deliveryCoords) {
      const deliveryGeocode = await geocodeAddress(deliveryAddress);
      if (!deliveryGeocode?.coordinates) {
        return jsonError("Could not geocode delivery address", 400);
      }
      deliveryCoords = deliveryGeocode.coordinates;
    }

    // Prepare Lalamove quotation request
    const quotationRequest: LalamoveQuotationRequest = {
      serviceType,
      specialRequests,
      language: 'en',
      stops: [
        {
          coordinates: {
            lat: pickupCoords.latitude.toString(),
            lng: pickupCoords.longitude.toString(),
          },
          address: pickupAddress,
        },
        {
          coordinates: {
            lat: deliveryCoords.latitude.toString(),
            lng: deliveryCoords.longitude.toString(),
          },
          address: deliveryAddress,
        },
      ],
      item: item || {
        quantity: "1",
        weight: "1",
      },
    };

    const quotation = await getQuotation(quotationRequest);

    return jsonOk({
      quotation: quotation.data,
      pickupCoordinates: pickupCoords,
      deliveryCoordinates: deliveryCoords,
    });
  } catch (error: any) {
    console.error("Lalamove quotation error:", error);
    if (error instanceof LalamoveError) {
      return jsonError(error.message, 400);
    }
    return jsonError(error.message || "Failed to get quotation", 500);
  }
}

