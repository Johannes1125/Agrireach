import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type NotificationPriority = "low" | "medium" | "high";

export interface INotification extends Document {
  user_id: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  action_url?: string;
  created_at: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, default: "medium", enum: ["low", "medium", "high"] },
    read: { type: Boolean, default: false },
    action_url: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

NotificationSchema.index({ user_id: 1, read: 1, created_at: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export interface INotificationPreference extends Document {
  user_id: Types.ObjectId;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  job_notifications: boolean;
  order_notifications: boolean;
  message_notifications: boolean;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    email_enabled: { type: Boolean, default: true },
    push_enabled: { type: Boolean, default: true },
    sms_enabled: { type: Boolean, default: false },
    job_notifications: { type: Boolean, default: true },
    order_notifications: { type: Boolean, default: true },
    message_notifications: { type: Boolean, default: true },
  },
  { timestamps: false }
);

export const NotificationPreference: Model<INotificationPreference> =
  mongoose.models.NotificationPreference || mongoose.model<INotificationPreference>("NotificationPreference", NotificationPreferenceSchema);
