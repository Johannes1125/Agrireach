import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type OtpCodeType = "registration" | "password_reset" | "checkout";

export interface IOtpCode extends Document {
  user_id?: Types.ObjectId | null;
  email: string;
  code: string;
  type: OtpCodeType;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

const OtpCodeSchema = new Schema<IOtpCode>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },
    email: { type: String, required: true },
    code: { type: String, required: true },
    type: { type: String, required: true, enum: ["registration", "password_reset", "checkout"] },
    expires_at: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

OtpCodeSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
OtpCodeSchema.index({ email: 1, type: 1, created_at: -1 });

export const OtpCode: Model<IOtpCode> =
  mongoose.models.OtpCode || mongoose.model<IOtpCode>("OtpCode", OtpCodeSchema);


