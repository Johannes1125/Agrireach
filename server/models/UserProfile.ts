import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IUserProfile extends Document {
  user_id: Types.ObjectId;
  phone?: string;
  website?: string;
  company_name?: string;
  business_type?: string;
  industry?: string;
  company_size?: string;
  business_description?: string;
  business_address?: string;
  business_coordinates?: {
    latitude: number;
    longitude: number;
  };
  business_registration?: string;
  years_in_business?: number;
  services_offered?: string[];
  business_hours?: string;
  business_logo?: string;
  skills?: Array<{
    name: string;
    level: number; // 1-4 (Beginner to Expert)
    category: string;
  }> | string[]; // Support both new object format and old string array format
  certifications?: string[];
  preferences?: any;
  created_at: Date;
  updated_at: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    phone: { type: String },
    website: { type: String },
    company_name: { type: String },
    business_type: { type: String },
    industry: { type: String },
    company_size: { type: String },
    business_description: { type: String },
    business_address: { type: String },
    business_coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    business_registration: { type: String },
    years_in_business: { type: Number },
    services_offered: { type: [String], default: [] },
    business_hours: { type: String },
    business_logo: { type: String },
    skills: {
      type: Schema.Types.Mixed, // Supports both [String] and [{name, level, category}]
      default: [],
    },
    certifications: { type: [String], default: [] },
    preferences: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

UserProfileSchema.index({ user_id: 1 }, { unique: true });

export const UserProfile: Model<IUserProfile> =
  mongoose.models.UserProfile || mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
