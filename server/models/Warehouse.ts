import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type WarehouseType = "regional_hub" | "sorting_center" | "collection_point";

export interface IWarehouse extends Document {
  name: string;
  code: string; // Unique hub code e.g., "HUB-PAM"
  type: WarehouseType;
  
  // Location
  address: {
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postal_code?: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Coverage - provinces/cities this hub serves
  coverage_areas: string[];
  
  // Operating info
  operating_hours: {
    open: string; // "08:00"
    close: string; // "18:00"
    days: string[]; // ["Monday", "Tuesday", ...]
  };
  
  // Capacity
  daily_capacity: number; // Max packages per day
  current_load?: number; // Current packages in hub
  
  // Contact
  phone?: string;
  email?: string;
  manager_id?: Types.ObjectId;
  
  // Status
  is_active: boolean;
  
  // For routing - connected hubs for line haul
  connected_hubs: Types.ObjectId[];
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    type: {
      type: String,
      enum: ["regional_hub", "sorting_center", "collection_point"],
      default: "regional_hub",
      required: true,
    },
    
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postal_code: { type: String },
      country: { type: String, default: "Philippines" },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    
    coverage_areas: [{ type: String }],
    
    operating_hours: {
      open: { type: String, default: "08:00" },
      close: { type: String, default: "18:00" },
      days: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      },
    },
    
    daily_capacity: { type: Number, default: 500 },
    current_load: { type: Number, default: 0 },
    
    phone: { type: String },
    email: { type: String },
    manager_id: { type: Schema.Types.ObjectId, ref: "User" },
    
    is_active: { type: Boolean, default: true },
    
    connected_hubs: [{ type: Schema.Types.ObjectId, ref: "Warehouse" }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Indexes
WarehouseSchema.index({ code: 1 }, { unique: true });
WarehouseSchema.index({ "address.province": 1 });
WarehouseSchema.index({ coverage_areas: 1 });
WarehouseSchema.index({ is_active: 1 });

// Static method to find hub by location
WarehouseSchema.statics.findByLocation = async function (
  province: string,
  city?: string
): Promise<IWarehouse | null> {
  // First try to find by exact city match in coverage
  if (city) {
    const hubByCity = await this.findOne({
      is_active: true,
      coverage_areas: { $regex: new RegExp(city, "i") },
    });
    if (hubByCity) return hubByCity;
  }
  
  // Then try by province
  const hubByProvince = await this.findOne({
    is_active: true,
    $or: [
      { "address.province": { $regex: new RegExp(province, "i") } },
      { coverage_areas: { $regex: new RegExp(province, "i") } },
    ],
  });
  
  return hubByProvince;
};

export const Warehouse: Model<IWarehouse> =
  mongoose.models.Warehouse || mongoose.model<IWarehouse>("Warehouse", WarehouseSchema);

