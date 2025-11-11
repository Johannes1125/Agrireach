import mongoose, { Schema, Model, Document } from "mongoose";

export type UserRole = "worker" | "recruiter" | "buyer" | "admin";
export type UserStatus = "active" | "suspended" | "banned";

export interface IUser extends Document {
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole; // Legacy field - kept for backward compatibility
  roles: UserRole[]; // New field for multiple roles
  phone?: string;
  location?: string;
  location_coordinates?: {
    latitude: number;
    longitude: number;
  };
  avatar_url?: string;
  bio?: string;
  skills?: any; // JSONB equivalent
  verified: boolean;
  trust_score: number;
  verification_status: "none" | "pending" | "verified" | "rejected";
  verification_message?: string;
  verification_documents?: string[];
  verification_requested_at?: Date;
  verification_reviewed_at?: Date;

  email_verified: boolean;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    role: { type: String, required: true, enum: ["worker", "recruiter", "buyer", "admin"], index: true }, // Legacy field
    roles: { 
      type: [String], 
      enum: ["worker", "recruiter", "buyer", "admin"],
      default: function(this: IUser) { return [this.role] } // Default to array containing the legacy role
    },
    phone: { type: String },
    location: { type: String },
    location_coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    avatar_url: { type: String },
    bio: { type: String },
    skills: { type: Schema.Types.Mixed }, // JSONB equivalent
    verified: { type: Boolean, default: false },
    trust_score: { type: Number, default: 0 },
    verification_status: { type: String, enum: ["none", "pending", "verified", "rejected"], default: "none" },
    verification_message: { type: String },
    verification_documents: { type: [String], default: [] },
    verification_requested_at: { type: Date },
    verification_reviewed_at: { type: Date },

    email_verified: { type: Boolean, default: false },
    status: { type: String, default: "active", enum: ["active", "suspended", "banned"] },
    last_login: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Middleware to sync role with roles array for backward compatibility
UserSchema.pre('save', function(next) {
  // If roles is set, sync the first role to the legacy role field
  if (this.roles && this.roles.length > 0) {
    this.role = this.roles[0];
  }
  next();
});

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
