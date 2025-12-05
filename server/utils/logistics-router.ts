/**
 * Logistics Router
 * Routes packages through regional hubs and manages driver assignment
 * Now supports direct delivery for same-city orders (no hub needed)
 */

import { Types } from "mongoose";
import { Warehouse, IWarehouse } from "@/server/models/Warehouse";
import { Driver, IDriver, VehicleType, PACKAGE_SIZE_VEHICLES } from "@/server/models/Driver";
import { IDelivery, IDeliveryLeg, PackageSize, LegType } from "@/server/models/Delivery";
import { determineDeliveryType, DeliveryType } from "./shipping-calculator";

export interface RouteResult {
  success: boolean;
  origin_hub: IWarehouse | null;
  destination_hub: IWarehouse | null;
  is_same_hub: boolean;
  is_direct_delivery: boolean;  // True if no hub routing needed (same city)
  delivery_type: DeliveryType;  // "direct" | "single_hub" | "hub_to_hub"
  legs: IDeliveryLeg[];
  estimated_days: number;
  error?: string;
}

export interface DriverAssignment {
  success: boolean;
  driver: IDriver | null;
  error?: string;
}

// Central Luzon hub mapping by province
const PROVINCE_HUB_MAPPING: Record<string, string> = {
  "pampanga": "HUB-PAM",
  "tarlac": "HUB-PAM",
  "bulacan": "HUB-BUL",
  "nueva ecija": "HUB-NE",
  "aurora": "HUB-NE",
  "zambales": "HUB-ZAM",
  "bataan": "HUB-ZAM",
  // Metro Manila goes to NCR sorting center
  "metro manila": "HUB-NCR",
  "ncr": "HUB-NCR",
  "manila": "HUB-NCR",
  "quezon city": "HUB-NCR",
  "makati": "HUB-NCR",
};

/**
 * Find the appropriate hub for a location
 */
export async function findHubForLocation(
  city: string,
  province?: string
): Promise<IWarehouse | null> {
  const searchTerms = [city, province].filter(Boolean).map(t => t?.toLowerCase() || "");
  
  // First, check province mapping
  for (const term of searchTerms) {
    for (const [key, hubCode] of Object.entries(PROVINCE_HUB_MAPPING)) {
      if (term.includes(key) || key.includes(term)) {
        const hub = await Warehouse.findOne({ code: hubCode, is_active: true });
        if (hub) return hub;
      }
    }
  }
  
  // Then try finding by coverage areas
  for (const term of searchTerms) {
    const hub = await Warehouse.findOne({
      is_active: true,
      coverage_areas: { $regex: new RegExp(term, "i") },
    });
    if (hub) return hub;
  }
  
  // Fallback to NCR sorting center
  const ncrHub = await Warehouse.findOne({ code: "HUB-NCR", is_active: true });
  return ncrHub;
}

/**
 * Calculate route for a delivery through hubs
 * Supports 3 delivery types:
 * - DIRECT: Same city, 1 leg (Seller → Buyer directly), no hub
 * - SINGLE_HUB: Same province, 2 legs (Seller → Hub → Buyer)
 * - HUB_TO_HUB: Different regions, 3 legs (Seller → Hub A → Hub B → Buyer)
 */
export async function calculateRoute(
  pickupCity: string,
  pickupProvince: string,
  deliveryCity: string,
  deliveryProvince: string,
  pickupCoordinates?: { latitude: number; longitude: number },
  deliveryCoordinates?: { latitude: number; longitude: number },
  sellerName?: string,
  buyerName?: string
): Promise<RouteResult> {
  try {
    // Determine delivery type based on locations
    const sellerLocation = `${pickupCity}, ${pickupProvince}`;
    const buyerLocation = `${deliveryCity}, ${deliveryProvince}`;
    const deliveryType = determineDeliveryType(sellerLocation, buyerLocation);
    
    const legs: IDeliveryLeg[] = [];
    
    // ===== DIRECT DELIVERY: Same city, no hub needed =====
    if (deliveryType === "direct") {
      // Single leg: Seller directly to Buyer
      legs.push({
        leg_number: 1,
        type: "delivery", // Combined pickup + delivery
        from_location: {
          name: sellerName || "Seller",
          address: `${pickupCity}, ${pickupProvince}`,
          coordinates: pickupCoordinates,
        },
        to_location: {
          name: buyerName || "Buyer",
          address: `${deliveryCity}, ${deliveryProvince}`,
          coordinates: deliveryCoordinates,
        },
        status: "pending",
      });
      
      return {
        success: true,
        origin_hub: null,      // No hub needed!
        destination_hub: null,
        is_same_hub: true,
        is_direct_delivery: true,
        delivery_type: "direct",
        legs,
        estimated_days: 1,     // Same day to 1 day
      };
    }
    
    // ===== SINGLE HUB: Same province, different city =====
    if (deliveryType === "single_hub") {
      // Find the nearest hub for both
      const nearestHub = await findHubForLocation(pickupCity, pickupProvince);
      if (!nearestHub) {
        return {
          success: false,
          origin_hub: null,
          destination_hub: null,
          is_same_hub: false,
          is_direct_delivery: false,
          delivery_type: "single_hub",
          legs: [],
          estimated_days: 0,
          error: "No hub found for location",
        };
      }
      
      // Leg 1: Pickup (Seller → Hub)
      legs.push({
        leg_number: 1,
        type: "pickup",
        from_location: {
          name: sellerName || "Seller",
          address: `${pickupCity}, ${pickupProvince}`,
          coordinates: pickupCoordinates,
        },
        to_location: {
          name: nearestHub.name,
          address: `${nearestHub.address.city}, ${nearestHub.address.province}`,
          hub_id: nearestHub._id as Types.ObjectId,
          coordinates: nearestHub.address.coordinates,
        },
        status: "pending",
      });
      
      // Leg 2: Delivery (Hub → Buyer)
      legs.push({
        leg_number: 2,
        type: "delivery",
        from_location: {
          name: nearestHub.name,
          address: `${nearestHub.address.city}, ${nearestHub.address.province}`,
          hub_id: nearestHub._id as Types.ObjectId,
          coordinates: nearestHub.address.coordinates,
        },
        to_location: {
          name: buyerName || "Buyer",
          address: `${deliveryCity}, ${deliveryProvince}`,
          coordinates: deliveryCoordinates,
        },
        status: "pending",
      });
      
      return {
        success: true,
        origin_hub: nearestHub,
        destination_hub: nearestHub, // Same hub for both
        is_same_hub: true,
        is_direct_delivery: false,
        delivery_type: "single_hub",
        legs,
        estimated_days: 2,     // 1-2 days
      };
    }
    
    // ===== HUB TO HUB: Different regions =====
    // Find origin hub
    const originHub = await findHubForLocation(pickupCity, pickupProvince);
    if (!originHub) {
      return {
        success: false,
        origin_hub: null,
        destination_hub: null,
        is_same_hub: false,
        is_direct_delivery: false,
        delivery_type: "hub_to_hub",
        legs: [],
        estimated_days: 0,
        error: "No hub found for pickup location",
      };
    }
    
    // Find destination hub
    const destinationHub = await findHubForLocation(deliveryCity, deliveryProvince);
    if (!destinationHub) {
      return {
        success: false,
        origin_hub: originHub,
        destination_hub: null,
        is_same_hub: false,
        is_direct_delivery: false,
        delivery_type: "hub_to_hub",
        legs: [],
        estimated_days: 0,
        error: "No hub found for delivery location",
      };
    }
    
    const isSameHub = String(originHub._id) === String(destinationHub._id);
    
    // Leg 1: Pickup (Seller → Origin Hub)
    legs.push({
      leg_number: 1,
      type: "pickup",
      from_location: {
        name: sellerName || "Seller",
        address: `${pickupCity}, ${pickupProvince}`,
        coordinates: pickupCoordinates,
      },
      to_location: {
        name: originHub.name,
        address: `${originHub.address.city}, ${originHub.address.province}`,
        hub_id: originHub._id as Types.ObjectId,
        coordinates: originHub.address.coordinates,
      },
      status: "pending",
    });
    
    if (!isSameHub) {
      // Leg 2: Line Haul (Origin Hub → Destination Hub)
      legs.push({
        leg_number: 2,
        type: "line_haul",
        from_location: {
          name: originHub.name,
          address: `${originHub.address.city}, ${originHub.address.province}`,
          hub_id: originHub._id as Types.ObjectId,
          coordinates: originHub.address.coordinates,
        },
        to_location: {
          name: destinationHub.name,
          address: `${destinationHub.address.city}, ${destinationHub.address.province}`,
          hub_id: destinationHub._id as Types.ObjectId,
          coordinates: destinationHub.address.coordinates,
        },
        status: "pending",
      });
    }
    
    // Leg 3 (or 2 if same hub): Delivery (Destination Hub → Buyer)
    legs.push({
      leg_number: isSameHub ? 2 : 3,
      type: "delivery",
      from_location: {
        name: destinationHub.name,
        address: `${destinationHub.address.city}, ${destinationHub.address.province}`,
        hub_id: destinationHub._id as Types.ObjectId,
        coordinates: destinationHub.address.coordinates,
      },
      to_location: {
        name: buyerName || "Buyer",
        address: `${deliveryCity}, ${deliveryProvince}`,
        coordinates: deliveryCoordinates,
      },
      status: "pending",
    });
    
    // Estimate delivery days based on route
    const estimatedDays = isSameHub ? 3 : 5;
    
    return {
      success: true,
      origin_hub: originHub,
      destination_hub: destinationHub,
      is_same_hub: isSameHub,
      is_direct_delivery: false,
      delivery_type: "hub_to_hub",
      legs,
      estimated_days: estimatedDays,
    };
  } catch (error: any) {
    console.error("Route calculation error:", error);
    return {
      success: false,
      origin_hub: null,
      destination_hub: null,
      is_same_hub: false,
      is_direct_delivery: false,
      delivery_type: "hub_to_hub",
      legs: [],
      estimated_days: 0,
      error: error.message || "Failed to calculate route",
    };
  }
}

/**
 * Get required vehicle types based on package size
 */
export function getRequiredVehicles(packageSize: PackageSize): VehicleType[] {
  return PACKAGE_SIZE_VEHICLES[packageSize] || ["motorcycle", "car"];
}

/**
 * Auto-assign a driver for a delivery leg
 */
export async function autoAssignDriver(
  hubId: string | Types.ObjectId,
  legType: LegType,
  packageSize: PackageSize,
  packageWeight: number
): Promise<DriverAssignment> {
  try {
    const requiredVehicles = getRequiredVehicles(packageSize);
    
    // Map leg type to driver type
    const driverType = legType === "line_haul" ? "line_haul" : legType;
    
    // Find available drivers at the hub
    const query: any = {
      hub_id: hubId,
      status: "available",
      is_active: true,
      "vehicle.max_weight": { $gte: packageWeight },
      "vehicle.type": { $in: requiredVehicles },
    };
    
    // For pickup/delivery, also include all_round drivers
    if (legType !== "line_haul") {
      query.$or = [
        { driver_type: driverType },
        { driver_type: "all_round" },
      ];
    } else {
      query.driver_type = "line_haul";
    }
    
    const drivers = await Driver.find(query)
      .sort({ rating: -1, completed_deliveries: -1 })
      .limit(5);
    
    if (drivers.length === 0) {
      return {
        success: false,
        driver: null,
        error: `No available ${legType} driver with ${requiredVehicles.join("/")} at this hub`,
      };
    }
    
    // Return best available driver
    return {
      success: true,
      driver: drivers[0],
    };
  } catch (error: any) {
    console.error("Driver assignment error:", error);
    return {
      success: false,
      driver: null,
      error: error.message || "Failed to assign driver",
    };
  }
}

/**
 * Find all available drivers at a hub for a specific leg type
 */
export async function findAvailableDrivers(
  hubId: string | Types.ObjectId,
  legType: LegType,
  packageSize: PackageSize,
  packageWeight: number
): Promise<IDriver[]> {
  const requiredVehicles = getRequiredVehicles(packageSize);
  
  const query: any = {
    hub_id: hubId,
    status: "available",
    is_active: true,
    "vehicle.max_weight": { $gte: packageWeight },
    "vehicle.type": { $in: requiredVehicles },
  };
  
  if (legType !== "line_haul") {
    query.$or = [
      { driver_type: legType },
      { driver_type: "all_round" },
    ];
  } else {
    query.driver_type = "line_haul";
  }
  
  return Driver.find(query).sort({ rating: -1, completed_deliveries: -1 });
}

/**
 * Estimate delivery time based on route and delivery type
 */
export function estimateDeliveryTime(
  deliveryType: DeliveryType,
  pickupTime?: Date
): Date {
  const start = pickupTime || new Date();
  
  // Hours to add based on delivery type
  let hoursToAdd: number;
  switch (deliveryType) {
    case "direct":
      hoursToAdd = 12; // Same day to half a day
      break;
    case "single_hub":
      hoursToAdd = 36; // 1.5 days
      break;
    case "hub_to_hub":
    default:
      hoursToAdd = 72; // 3 days
      break;
  }
  
  const estimated = new Date(start);
  estimated.setHours(estimated.getHours() + hoursToAdd);
  
  // Adjust for weekends
  const day = estimated.getDay();
  if (day === 0) estimated.setDate(estimated.getDate() + 1); // Sunday → Monday
  if (day === 6) estimated.setDate(estimated.getDate() + 2); // Saturday → Monday
  
  return estimated;
}

/**
 * Get package size from weight
 */
export function getPackageSizeFromWeight(weightKg: number): PackageSize {
  if (weightKg <= 5) return "small";
  if (weightKg <= 20) return "medium";
  if (weightKg <= 50) return "large";
  return "bulk";
}

/**
 * Initialize delivery with route and legs
 */
export async function initializeDeliveryRoute(
  delivery: IDelivery,
  sellerName?: string,
  buyerName?: string
): Promise<RouteResult> {
  const pickupCity = delivery.pickup_address.city;
  const pickupProvince = delivery.pickup_address.province || "";
  const deliveryCity = delivery.delivery_address.city;
  const deliveryProvince = delivery.delivery_address.state;
  
  return calculateRoute(
    pickupCity,
    pickupProvince,
    deliveryCity,
    deliveryProvince,
    delivery.pickup_address.coordinates,
    delivery.delivery_address.coordinates,
    sellerName,
    buyerName
  );
}

