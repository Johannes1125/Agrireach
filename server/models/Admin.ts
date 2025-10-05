import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IModerationQueue extends Document {
  content_type: string;
  content_id: Types.ObjectId;
  reporter_id?: Types.ObjectId;
  reason?: string;
  status: string; // pending, approved, rejected
  moderator_id?: Types.ObjectId;
  resolved_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const ModerationQueueSchema = new Schema<IModerationQueue>(
  {
    content_type: { type: String, required: true, index: true },
    content_id: { type: Schema.Types.ObjectId, required: true, index: true },
    reporter_id: { type: Schema.Types.ObjectId, ref: "User" },
    reason: { type: String },
    status: { type: String, default: "pending", index: true },
    moderator_id: { type: Schema.Types.ObjectId, ref: "User" },
    resolved_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export const ModerationQueue: Model<IModerationQueue> =
  mongoose.models.ModerationQueue || mongoose.model<IModerationQueue>("ModerationQueue", ModerationQueueSchema);

export interface ISystemSetting extends Document {
  key: string;
  value: any;
  type?: string;
  description?: string;
  updated_at: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    type: { type: String },
    description: { type: String },
  },
  { timestamps: { createdAt: false, updatedAt: "updated_at" } }
);

export const SystemSetting: Model<ISystemSetting> =
  mongoose.models.SystemSetting || mongoose.model<ISystemSetting>("SystemSetting", SystemSettingSchema);

export interface IAuditLog extends Document {
  admin_id: Types.ObjectId;
  action: string;
  resource_type: string;
  resource_id?: Types.ObjectId;
  changes?: any;
  ip_address?: string;
  created_at: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true },
    resource_type: { type: String, required: true },
    resource_id: { type: Schema.Types.ObjectId },
    changes: { type: Schema.Types.Mixed },
    ip_address: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
