import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IFarmer extends Document {
  user_id: Types.ObjectId;
  specialty: string;
  experience_years?: number;
  farm_size?: string;
  certifications?: any; // JSONB equivalent
  rating: number;
  reviews_count: number;
  response_time?: string;
  completion_rate: number;
  created_at: Date;
  updated_at: Date;
}

const FarmerSchema = new Schema<IFarmer>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    specialty: { type: String, required: true },
    experience_years: { type: Number },
    farm_size: { type: String },
    certifications: { type: Schema.Types.Mixed }, // JSONB equivalent
    rating: { type: Number, default: 0 },
    reviews_count: { type: Number, default: 0 },
    response_time: { type: String },
    completion_rate: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const Farmer: Model<IFarmer> = mongoose.models.Farmer || mongoose.model<IFarmer>("Farmer", FarmerSchema);
