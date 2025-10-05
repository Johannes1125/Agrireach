import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type ReviewStatus = "active" | "pending" | "hidden";

export interface IReview extends Document {
  reviewer_id: Types.ObjectId;
  reviewee_id: Types.ObjectId;
  rating: number;
  title?: string;
  comment?: string;
  category?: string;
  helpful_count: number;
  verified_purchase: boolean;
  status: ReviewStatus;
  created_at: Date;
  updated_at: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewer_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reviewee_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String },
    category: { type: String },
    helpful_count: { type: Number, default: 0 },
    verified_purchase: { type: Boolean, default: false },
    status: { type: String, default: "active", enum: ["active", "pending", "hidden"], index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ReviewSchema.index({ reviewee_id: 1, created_at: -1 });

export const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export interface IReviewVote extends Document {
  review_id: Types.ObjectId;
  user_id: Types.ObjectId;
  vote_type: "helpful" | "not_helpful";
  created_at: Date;
}

const ReviewVoteSchema = new Schema<IReviewVote>(
  {
    review_id: { type: Schema.Types.ObjectId, ref: "Review", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vote_type: { type: String, required: true, enum: ["helpful", "not_helpful"] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

ReviewVoteSchema.index({ review_id: 1, user_id: 1 }, { unique: true });

export const ReviewVote: Model<IReviewVote> =
  mongoose.models.ReviewVote || mongoose.model<IReviewVote>("ReviewVote", ReviewVoteSchema);


