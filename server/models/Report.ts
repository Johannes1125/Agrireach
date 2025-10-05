import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type ReportType = "user" | "forum_post" | "product" | "review";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type ReportPriority = "low" | "medium" | "high";

export interface IReport extends Document {
  reporter_id: Types.ObjectId;
  reported_user_id?: Types.ObjectId;
  type: ReportType;
  content_id?: Types.ObjectId;
  reason: string;
  description: string;
  evidence?: any; // JSONB equivalent
  status: ReportStatus;
  priority: ReportPriority;
  admin_notes?: string;
  resolved_by?: Types.ObjectId;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporter_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reported_user_id: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, required: true, enum: ["user", "forum_post", "product", "review"], index: true },
    content_id: { type: Schema.Types.ObjectId },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    evidence: { type: Schema.Types.Mixed }, // JSONB equivalent
    status: { type: String, default: "pending", enum: ["pending", "investigating", "resolved", "dismissed"], index: true },
    priority: { type: String, default: "medium", enum: ["low", "medium", "high"], index: true },
    admin_notes: { type: String },
    resolved_by: { type: Schema.Types.ObjectId, ref: "User" },
    resolved_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ReportSchema.index({ status: 1, priority: 1, created_at: -1 });

export const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export interface IAdminActivityLog extends Document {
  admin_id: Types.ObjectId;
  action: string;
  target_type?: string;
  target_id?: Types.ObjectId;
  details?: any; // JSONB equivalent
  ip_address?: string;
  created_at: Date;
}

const AdminActivityLogSchema = new Schema<IAdminActivityLog>(
  {
    admin_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    target_type: { type: String },
    target_id: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed }, // JSONB equivalent
    ip_address: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

AdminActivityLogSchema.index({ admin_id: 1, created_at: -1 });

export const AdminActivityLog: Model<IAdminActivityLog> = mongoose.models.AdminActivityLog || mongoose.model<IAdminActivityLog>("AdminActivityLog", AdminActivityLogSchema);
