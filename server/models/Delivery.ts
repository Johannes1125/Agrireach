import mongoose, { Schema, Model, Document, Types } from "mongoose";

// Enhanced status with hub-based tracking
export type DeliveryStatus = 
  | "pending"                    // Order placed, awaiting pickup assignment
  | "pickup_assigned"            // Pickup rider assigned
  | "pickup_in_progress"         // Rider heading to seller
  | "picked_up"                  // Package collected from seller
  | "at_origin_hub"              // Package arrived at origin hub
  | "sorted"                     // Package sorted for line haul
  | "line_haul_in_transit"       // Truck moving between hubs
  | "at_destination_hub"         // Package at destination hub
  | "delivery_assigned"          // Delivery rider assigned
  | "out_for_delivery"           // Rider heading to buyer
  | "delivered"                  // Successfully delivered
  | "cancelled"                  // Cancelled
  | "returned";                  // Returned to seller

export type VehicleType = "motorcycle" | "car" | "van" | "mini_truck" | "truck";
export type PackageSize = "small" | "medium" | "large" | "bulk";
export type LegType = "pickup" | "line_haul" | "delivery";
export type LegStatus = "pending" | "assigned" | "in_progress" | "completed" | "cancelled";

// Delivery leg interface for multi-leg tracking
export interface IDeliveryLeg {
  leg_number: number; // 1, 2, or 3
  type: LegType;
  driver_id?: Types.ObjectId;
  driver_name?: string;
  driver_phone?: string;
  vehicle_type?: VehicleType;
  vehicle_plate?: string;
  
  from_location: {
    name: string;
    address: string;
    hub_id?: Types.ObjectId;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  to_location: {
    name: string;
    address: string;
    hub_id?: Types.ObjectId;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  status: LegStatus;
  assigned_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  distance_km?: number;
  notes?: string;
}

export interface IDelivery extends Document {
  order_id: Types.ObjectId;
  buyer_id: Types.ObjectId;
  seller_id: Types.ObjectId;
  
  // Package information
  package_size: PackageSize;
  package_weight: number; // kg
  package_description?: string;
  
  // Pickup information (seller location)
  pickup_address: {
    line1: string;
    city: string;
    province?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Delivery information (buyer location)
  delivery_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Hub routing
  origin_hub_id?: Types.ObjectId;
  destination_hub_id?: Types.ObjectId;
  is_same_hub_delivery: boolean; // True if origin and destination are same hub
  
  // Multi-leg delivery tracking
  legs: IDeliveryLeg[];
  current_leg: number; // Which leg is active (1, 2, or 3)
  
  // Driver assignments for each leg (quick reference)
  pickup_driver_id?: Types.ObjectId;
  line_haul_driver_id?: Types.ObjectId;
  delivery_driver_id?: Types.ObjectId;
  
  // Overall status
  status: DeliveryStatus;
  
  // Legacy driver fields (for backward compatibility)
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  vehicle_type?: VehicleType;
  vehicle_plate_number?: string;
  vehicle_description?: string;
  
  // Tracking
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  tracking_number: string;
  
  // Notes
  delivery_notes?: string;
  seller_notes?: string;
  hub_notes?: string;
  
  // Proof of delivery
  proof_of_delivery?: {
    image_url?: string;
    signature?: string;
    delivered_at?: Date;
    received_by?: string;
    notes?: string;
  };
  
  // Timeline tracking
  timeline: Array<{
    status: string;
    timestamp: Date;
    location?: string;
    notes?: string;
    updated_by?: string;
  }>;
  
  // Timestamps
  assigned_at?: Date;
  picked_up_at?: Date;
  at_origin_hub_at?: Date;
  line_haul_started_at?: Date;
  at_destination_hub_at?: Date;
  out_for_delivery_at?: Date;
  in_transit_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const DeliveryLegSchema = new Schema<IDeliveryLeg>({
  leg_number: { type: Number, required: true },
  type: { type: String, enum: ["pickup", "line_haul", "delivery"], required: true },
  driver_id: { type: Schema.Types.ObjectId, ref: "Driver" },
  driver_name: { type: String },
  driver_phone: { type: String },
  vehicle_type: { type: String, enum: ["motorcycle", "car", "van", "mini_truck", "truck"] },
  vehicle_plate: { type: String },
  
  from_location: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    hub_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  
  to_location: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    hub_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
  },
  
  status: { type: String, enum: ["pending", "assigned", "in_progress", "completed", "cancelled"], default: "pending" },
  assigned_at: { type: Date },
  started_at: { type: Date },
  completed_at: { type: Date },
  distance_km: { type: Number },
  notes: { type: String },
}, { _id: false });

const DeliverySchema = new Schema<IDelivery>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    // Package info
    package_size: { type: String, enum: ["small", "medium", "large", "bulk"], default: "small" },
    package_weight: { type: Number, default: 1 },
    package_description: { type: String },
    
    pickup_address: {
      line1: { type: String, required: true },
      city: { type: String, required: true },
      province: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    
    delivery_address: {
      line1: { type: String, required: true },
      line2: { type: String },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postal_code: { type: String, required: true },
      country: { type: String, default: "Philippines" },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    
    // Hub routing
    origin_hub_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    destination_hub_id: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    is_same_hub_delivery: { type: Boolean, default: false },
    
    // Multi-leg tracking
    legs: [DeliveryLegSchema],
    current_leg: { type: Number, default: 1 },
    
    // Driver assignments
    pickup_driver_id: { type: Schema.Types.ObjectId, ref: "Driver" },
    line_haul_driver_id: { type: Schema.Types.ObjectId, ref: "Driver" },
    delivery_driver_id: { type: Schema.Types.ObjectId, ref: "Driver" },
    
    status: {
      type: String,
      enum: [
        "pending", "pickup_assigned", "pickup_in_progress", "picked_up",
        "at_origin_hub", "sorted", "line_haul_in_transit", "at_destination_hub",
        "delivery_assigned", "out_for_delivery", "delivered", "cancelled", "returned"
      ],
      default: "pending",
      required: true,
    },
    
    // Legacy fields (backward compatibility)
    driver_name: { type: String },
    driver_phone: { type: String },
    driver_email: { type: String },
    vehicle_type: { type: String, enum: ["motorcycle", "car", "van", "mini_truck", "truck"] },
    vehicle_plate_number: { type: String },
    vehicle_description: { type: String },
    
    estimated_delivery_time: { type: Date },
    actual_delivery_time: { type: Date },
    tracking_number: { type: String, required: true },
    
    delivery_notes: { type: String },
    seller_notes: { type: String },
    hub_notes: { type: String },
    
    proof_of_delivery: {
      image_url: { type: String },
      signature: { type: String },
      delivered_at: { type: Date },
      received_by: { type: String },
      notes: { type: String },
    },
    
    timeline: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      location: { type: String },
      notes: { type: String },
      updated_by: { type: String },
    }],
    
    assigned_at: { type: Date },
    picked_up_at: { type: Date },
    at_origin_hub_at: { type: Date },
    line_haul_started_at: { type: Date },
    at_destination_hub_at: { type: Date },
    out_for_delivery_at: { type: Date },
    in_transit_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Indexes
DeliverySchema.index({ order_id: 1 }, { unique: true });
DeliverySchema.index({ tracking_number: 1 }, { unique: true });
DeliverySchema.index({ seller_id: 1, status: 1 });
DeliverySchema.index({ buyer_id: 1, status: 1 });
DeliverySchema.index({ origin_hub_id: 1, status: 1 });
DeliverySchema.index({ destination_hub_id: 1, status: 1 });
DeliverySchema.index({ pickup_driver_id: 1 });
DeliverySchema.index({ delivery_driver_id: 1 });

// Method to add timeline entry
DeliverySchema.methods.addTimelineEntry = function (
  status: string,
  location?: string,
  notes?: string,
  updatedBy?: string
) {
  this.timeline.push({
    status,
    timestamp: new Date(),
    location,
    notes,
    updated_by: updatedBy,
  });
  return this.save();
};

// Method to get current leg details
DeliverySchema.methods.getCurrentLeg = function (): IDeliveryLeg | undefined {
  return this.legs.find((leg: IDeliveryLeg) => leg.leg_number === this.current_leg);
};

export const Delivery: Model<IDelivery> =
  mongoose.models.Delivery || mongoose.model<IDelivery>("Delivery", DeliverySchema);

// Status progression map (for validation)
export const STATUS_PROGRESSION: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ["pickup_assigned", "cancelled"],
  pickup_assigned: ["pickup_in_progress", "cancelled"],
  pickup_in_progress: ["picked_up", "cancelled"],
  picked_up: ["at_origin_hub", "cancelled"],
  at_origin_hub: ["sorted", "cancelled"],
  sorted: ["line_haul_in_transit", "out_for_delivery", "cancelled"], // out_for_delivery if same hub
  line_haul_in_transit: ["at_destination_hub", "cancelled"],
  at_destination_hub: ["delivery_assigned", "cancelled"],
  delivery_assigned: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "returned", "cancelled"],
  delivered: [],
  cancelled: [],
  returned: [],
};
