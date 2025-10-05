import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type PayType = "hourly" | "daily" | "project";
export type UrgencyLevel = "low" | "medium" | "high";
export type OpportunityStatus = "active" | "closed" | "filled";

export interface IOpportunity extends Document {
  recruiter_id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  location: string;
  pay_rate: number;
  pay_type: PayType;
  duration?: string;
  urgency: UrgencyLevel;
  required_skills?: any; // JSONB equivalent
  experience_level?: string;
  start_date?: Date;
  status: OpportunityStatus;
  views: number;
  applications_count: number;
  created_at: Date;
  updated_at: Date;
}

const OpportunitySchema = new Schema<IOpportunity>(
  {
    recruiter_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, index: "text" },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    location: { type: String, required: true },
    pay_rate: { type: Number, required: true },
    pay_type: { type: String, required: true, enum: ["hourly", "daily", "project"], index: true },
    duration: { type: String },
    urgency: { type: String, required: true, enum: ["low", "medium", "high"], index: true },
    required_skills: { type: Schema.Types.Mixed }, // JSONB equivalent
    experience_level: { type: String },
    start_date: { type: Date },
    status: { type: String, default: "active", enum: ["active", "closed", "filled"], index: true },
    views: { type: Number, default: 0 },
    applications_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

OpportunitySchema.index({ title: "text", description: "text" });

export const Opportunity: Model<IOpportunity> = mongoose.models.Opportunity || mongoose.model<IOpportunity>("Opportunity", OpportunitySchema);

// Keep Job as alias for backward compatibility
export const Job = Opportunity;

export type ApplicationStatus = "pending" | "reviewed" | "accepted" | "rejected";

export interface IJobApplication extends Document {
  opportunity_id: Types.ObjectId;
  worker_id: Types.ObjectId;
  cover_letter?: string;
  resume_url?: string;
  status: ApplicationStatus;
  created_at: Date;
  updated_at: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    opportunity_id: { type: Schema.Types.ObjectId, ref: "Opportunity", required: true, index: true },
    worker_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cover_letter: { type: String },
    resume_url: { type: String },
    status: { type: String, default: "pending", enum: ["pending", "reviewed", "accepted", "rejected"], index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

JobApplicationSchema.index({ opportunity_id: 1, worker_id: 1 }, { unique: true });

export const JobApplication: Model<IJobApplication> =
  mongoose.models.JobApplication || mongoose.model<IJobApplication>("JobApplication", JobApplicationSchema);


