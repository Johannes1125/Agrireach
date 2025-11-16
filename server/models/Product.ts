import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type ProductStatus = "active" | "sold" | "pending_approval";

export interface IProduct extends Document {
  seller_id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: number;
  location: string;
  images?: any; // JSONB equivalent
  organic: boolean;
  status: ProductStatus;
  views: number;
  created_at: Date;
  updated_at: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, index: "text" },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    quantity_available: { type: Number, required: true },
    location: { type: String, required: true },
    images: { type: Schema.Types.Mixed }, // JSONB equivalent
    organic: { type: Boolean, default: false },
    status: { type: String, default: "pending_approval", enum: ["active", "sold", "pending_approval"] },
    views: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ProductSchema.index({ title: "text", description: "text" });

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export interface ICartItem extends Document {
  user_id: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
  created_at: Date;
  updated_at: Date;
}

const CartItemSchema = new Schema<ICartItem>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

CartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export const CartItem: Model<ICartItem> = mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", CartItemSchema);

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";

export interface IOrder extends Document {
  buyer_id: Types.ObjectId;
  seller_id: Types.ObjectId;
  product_id?: Types.ObjectId;
  items?: Array<{
    product_id: Types.ObjectId;
    quantity: number;
    price: number;
  }>;
  quantity: number;
  total_price: number;
  delivery_address: string;
  delivery_address_structured?: {
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
  pickup_address?: {
    line1: string;
    city: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  payment_intent_id?: string;
  payment_source_id?: string;
  paymongo_payment_id?: string;
  // Lalamove delivery fields
  lalamove_order_id?: string;
  lalamove_quotation_id?: string;
  lalamove_driver_id?: string;
  lalamove_tracking_url?: string;
  lalamove_status?: string;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    items: [{
      product_id: { type: Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number },
      price: { type: Number }
    }],
    quantity: { type: Number, required: true },
    total_price: { type: Number, required: true },
    delivery_address: { type: String, required: true },
    delivery_address_structured: { type: Schema.Types.Mixed },
    pickup_address: { type: Schema.Types.Mixed },
    status: { type: String, default: "pending", enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] },
    payment_status: { type: String, default: "pending", enum: ["pending", "paid", "refunded", "failed"] },
    payment_method: { type: String },
    payment_intent_id: { type: String },
    payment_source_id: { type: String },
    paymongo_payment_id: { type: String },
    // Lalamove delivery fields
    lalamove_order_id: { type: String },
    lalamove_quotation_id: { type: String },
    lalamove_driver_id: { type: String },
    lalamove_tracking_url: { type: String },
    lalamove_status: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

OrderSchema.index({ buyer_id: 1, created_at: -1 });

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export interface IOrderItem extends Document {
  order_id: Types.ObjectId;
  product_id: Types.ObjectId;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: Date;
  updated_at: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    order_id: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true },
    subtotal: { type: Number, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Single index definition (removed duplicate)
OrderItemSchema.index({ order_id: 1 });

export const OrderItem: Model<IOrderItem> = mongoose.models.OrderItem || mongoose.model<IOrderItem>("OrderItem", OrderItemSchema);