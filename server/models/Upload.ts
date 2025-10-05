import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type UploadType = "avatar" | "product_image" | "resume" | "document";

export interface IUpload extends Document {
  user_id: Types.ObjectId;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  type: UploadType;
  created_at: Date;
}

const UploadSchema = new Schema<IUpload>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    filename: { type: String, required: true },
    original_name: { type: String, required: true },
    mime_type: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true, enum: ["avatar", "product_image", "resume", "document"], index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

UploadSchema.index({ user_id: 1, type: 1, created_at: -1 });

export const Upload: Model<IUpload> = mongoose.models.Upload || mongoose.model<IUpload>("Upload", UploadSchema);
