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
  avatar_url?: string;
  bio?: string;
  skills?: any; // JSONB equivalent
  verified: boolean;
  trust_score: number;

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
    avatar_url: { type: String },
    bio: { type: String },
    skills: { type: Schema.Types.Mixed }, // JSONB equivalent
    verified: { type: Boolean, default: false },
    trust_score: { type: Number, default: 0 },

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
