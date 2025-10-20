import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IUserSession extends Document {
  user_id: Types.ObjectId;
  token: string; // refresh token hash or opaque token
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

UserSessionSchema.index({ user_id: 1, token: 1 });

export const UserSession: Model<IUserSession> =
  mongoose.models.UserSession || mongoose.model<IUserSession>("UserSession", UserSessionSchema);
