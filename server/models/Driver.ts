import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type DriverType = "pickup" | "line_haul" | "delivery" | "all_round";
export type DriverStatus = "available" | "on_delivery" | "returning" | "off_duty" | "suspended";
export type VehicleType = "motorcycle" | "car" | "van" | "mini_truck" | "truck";

export interface IDriver extends Document {
  // Basic info
  user_id?: Types.ObjectId; // If driver has a user account
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  
  // Assignment
  hub_id: Types.ObjectId; // Home hub
  driver_type: DriverType;
  
  // Vehicle information
  vehicle: {
    type: VehicleType;
    plate_number: string;
    brand?: string;
    model?: string;
    color?: string;
    max_weight: number; // kg capacity
    max_volume?: number; // cubic meters (optional)
    description?: string;
  };
  
  // Status & Location
  status: DriverStatus;
  current_location?: {
    latitude: number;
    longitude: number;
    updated_at: Date;
  };
  
  // Currently assigned delivery
  current_delivery_id?: Types.ObjectId;
  
  // Performance metrics
  rating: number; // 1-5
  total_ratings: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  
  // Availability schedule (optional)
  availability?: {
    monday: { available: boolean; start?: string; end?: string };
    tuesday: { available: boolean; start?: string; end?: string };
    wednesday: { available: boolean; start?: string; end?: string };
    thursday: { available: boolean; start?: string; end?: string };
    friday: { available: boolean; start?: string; end?: string };
    saturday: { available: boolean; start?: string; end?: string };
    sunday: { available: boolean; start?: string; end?: string };
  };
  
  // License info
  license_number?: string;
  license_expiry?: Date;
  
  // Verification
  is_verified: boolean;
  verified_at?: Date;
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    photo_url: { type: String },
    
    hub_id: { type: Schema.Types.ObjectId, ref: "Warehouse", required: true },
    driver_type: {
      type: String,
      enum: ["pickup", "line_haul", "delivery", "all_round"],
      default: "all_round",
      required: true,
    },
    
    vehicle: {
      type: {
        type: String,
        enum: ["motorcycle", "car", "van", "mini_truck", "truck"],
        required: true,
      },
      plate_number: { type: String, required: true },
      brand: { type: String },
      model: { type: String },
      color: { type: String },
      max_weight: { type: Number, required: true }, // kg
      max_volume: { type: Number },
      description: { type: String },
    },
    
    status: {
      type: String,
      enum: ["available", "on_delivery", "returning", "off_duty", "suspended"],
      default: "available",
      required: true,
    },
    
    current_location: {
      latitude: { type: Number },
      longitude: { type: Number },
      updated_at: { type: Date },
    },
    
    current_delivery_id: { type: Schema.Types.ObjectId, ref: "Delivery" },
    
    rating: { type: Number, default: 5, min: 1, max: 5 },
    total_ratings: { type: Number, default: 0 },
    completed_deliveries: { type: Number, default: 0 },
    cancelled_deliveries: { type: Number, default: 0 },
    
    availability: {
      monday: { available: { type: Boolean, default: true }, start: String, end: String },
      tuesday: { available: { type: Boolean, default: true }, start: String, end: String },
      wednesday: { available: { type: Boolean, default: true }, start: String, end: String },
      thursday: { available: { type: Boolean, default: true }, start: String, end: String },
      friday: { available: { type: Boolean, default: true }, start: String, end: String },
      saturday: { available: { type: Boolean, default: true }, start: String, end: String },
      sunday: { available: { type: Boolean, default: false }, start: String, end: String },
    },
    
    license_number: { type: String },
    license_expiry: { type: Date },
    
    is_verified: { type: Boolean, default: false },
    verified_at: { type: Date },
    
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Indexes
DriverSchema.index({ hub_id: 1, status: 1, driver_type: 1 });
DriverSchema.index({ "vehicle.type": 1, status: 1 });
DriverSchema.index({ phone: 1 }, { unique: true });
DriverSchema.index({ is_active: 1, status: 1 });

// Virtual for success rate
DriverSchema.virtual("success_rate").get(function () {
  const total = this.completed_deliveries + this.cancelled_deliveries;
  if (total === 0) return 100;
  return Math.round((this.completed_deliveries / total) * 100);
});

// Method to check if driver can handle package
DriverSchema.methods.canHandlePackage = function (weightKg: number): boolean {
  return this.vehicle.max_weight >= weightKg;
};

// Static method to find available drivers for a package
DriverSchema.statics.findAvailableForPackage = async function (
  hubId: string,
  driverType: DriverType,
  packageWeight: number,
  requiredVehicleTypes?: VehicleType[]
): Promise<IDriver[]> {
  const query: any = {
    hub_id: hubId,
    status: "available",
    is_active: true,
    "vehicle.max_weight": { $gte: packageWeight },
  };
  
  // Filter by driver type (or all_round)
  query.$or = [
    { driver_type: driverType },
    { driver_type: "all_round" },
  ];
  
  // Filter by vehicle type if specified
  if (requiredVehicleTypes && requiredVehicleTypes.length > 0) {
    query["vehicle.type"] = { $in: requiredVehicleTypes };
  }
  
  return this.find(query)
    .sort({ rating: -1, completed_deliveries: -1 })
    .limit(10);
};

export const Driver: Model<IDriver> =
  mongoose.models.Driver || mongoose.model<IDriver>("Driver", DriverSchema);

// Vehicle weight capacities (for reference)
export const VEHICLE_CAPACITIES: Record<VehicleType, { minWeight: number; maxWeight: number; description: string }> = {
  motorcycle: { minWeight: 0, maxWeight: 10, description: "Small packages, up to 10kg" },
  car: { minWeight: 0, maxWeight: 30, description: "Medium packages, up to 30kg" },
  van: { minWeight: 0, maxWeight: 100, description: "Large packages, up to 100kg" },
  mini_truck: { minWeight: 20, maxWeight: 500, description: "Bulk items, 20-500kg" },
  truck: { minWeight: 100, maxWeight: 2000, description: "Heavy cargo, 100-2000kg" },
};

// Package size to vehicle type mapping
export const PACKAGE_SIZE_VEHICLES: Record<string, VehicleType[]> = {
  small: ["motorcycle", "car", "van"],
  medium: ["car", "van", "mini_truck"],
  large: ["van", "mini_truck", "truck"],
  bulk: ["mini_truck", "truck"],
};

