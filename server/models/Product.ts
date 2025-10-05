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
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, index: "text" },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    quantity_available: { type: Number, required: true },
    location: { type: String, required: true },
    images: { type: Schema.Types.Mixed }, // JSONB equivalent
    organic: { type: Boolean, default: false },
    status: { type: String, default: "pending_approval", enum: ["active", "sold", "pending_approval"], index: true },
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
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

CartItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export const CartItem: Model<ICartItem> = mongoose.models.CartItem || mongoose.model<ICartItem>("CartItem", CartItemSchema);

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface IOrder extends Document {
  buyer_id: Types.ObjectId;
  seller_id: Types.ObjectId;
  product_id?: Types.ObjectId;
  quantity: number;
  total_price: number;
  delivery_address: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    buyer_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seller_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    product_id: { type: Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, required: true },
    total_price: { type: Number, required: true },
    delivery_address: { type: String, required: true },
    status: { type: String, default: "pending", enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"], index: true },
    payment_status: { type: String, default: "pending", enum: ["pending", "paid", "refunded"], index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

OrderSchema.index({ buyer_id: 1, created_at: -1 });

export const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
