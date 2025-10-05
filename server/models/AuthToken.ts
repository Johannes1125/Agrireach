import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IVerificationToken extends Document {
  user_id: Types.ObjectId;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token_hash: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

VerificationTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const VerificationToken: Model<IVerificationToken> =
  mongoose.models.VerificationToken || mongoose.model<IVerificationToken>("VerificationToken", VerificationTokenSchema);

export interface IPasswordResetToken extends Document {
  user_id: Types.ObjectId;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

const PasswordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token_hash: { type: String, required: true, index: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

PasswordResetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken: Model<IPasswordResetToken> =
  mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>("PasswordResetToken", PasswordResetTokenSchema);
