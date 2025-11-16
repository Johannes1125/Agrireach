import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type DeliveryStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled";
export type VehicleType = "motorcycle" | "car" | "mini_truck" | "truck";

export interface IDelivery extends Document {
  order_id: Types.ObjectId; // Reference to Order
  buyer_id: Types.ObjectId;
  seller_id: Types.ObjectId;
  
  // Pickup information (seller location)
  pickup_address: {
    line1: string;
    city: string;
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
  
  // Delivery status
  status: DeliveryStatus;
  
  // Driver/Courier assignment (seller can assign custom driver)
  driver_name?: string;
  driver_phone?: string;
  driver_email?: string;
  vehicle_type?: VehicleType;
  vehicle_plate_number?: string;
  vehicle_description?: string; // Additional vehicle info
  
  // Tracking
  estimated_delivery_time?: Date;
  actual_delivery_time?: Date;
  tracking_number: string; // Auto-generated unique tracking number
  
  // Notes
  delivery_notes?: string;
  seller_notes?: string; // Notes from seller to driver
  proof_of_delivery?: {
    image_url?: string;
    signature?: string;
    delivered_at?: Date;
    received_by?: string;
    notes?: string;
  };
  
  // Timestamps
  assigned_at?: Date;
  picked_up_at?: Date;
  in_transit_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const DeliverySchema = new Schema<IDelivery>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    
    pickup_address: {
      line1: { type: String, required: true },
      city: { type: String, required: true },
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
    
    status: {
      type: String,
      enum: ["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"],
      default: "pending",
      required: true,
    },
    
    driver_name: { type: String },
    driver_phone: { type: String },
    driver_email: { type: String },
    vehicle_type: {
      type: String,
      enum: ["motorcycle", "car", "mini_truck", "truck"],
    },
    vehicle_plate_number: { type: String },
    vehicle_description: { type: String },
    
    estimated_delivery_time: { type: Date },
    actual_delivery_time: { type: Date },
    tracking_number: { type: String, required: true, unique: true },
    
    delivery_notes: { type: String },
    seller_notes: { type: String },
    proof_of_delivery: {
      image_url: { type: String },
      signature: { type: String },
      delivered_at: { type: Date },
      received_by: { type: String },
      notes: { type: String },
    },
    
    assigned_at: { type: Date },
    picked_up_at: { type: Date },
    in_transit_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Indexes for better query performance
DeliverySchema.index({ order_id: 1 }, { unique: true });
DeliverySchema.index({ tracking_number: 1 }, { unique: true });
DeliverySchema.index({ seller_id: 1, status: 1 });
DeliverySchema.index({ buyer_id: 1, status: 1 });

export const Delivery: Model<IDelivery> = mongoose.models.Delivery || mongoose.model<IDelivery>("Delivery", DeliverySchema);

