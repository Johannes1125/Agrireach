import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type ThreadStatus = "active" | "pending" | "hidden";

export interface IForumCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  posts_count: number;
  created_at: Date;
}

const ForumCategorySchema = new Schema<IForumCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    icon: { type: String },
    color: { type: String },
    posts_count: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

export const ForumCategory: Model<IForumCategory> = mongoose.models.ForumCategory || mongoose.model<IForumCategory>("ForumCategory", ForumCategorySchema);

export interface IForumThread extends Document {
  category_id: Types.ObjectId;
  author_id: Types.ObjectId;
  title: string;
  content: string;
  tags?: any; // JSONB equivalent
  pinned: boolean;
  locked: boolean;
  status: ThreadStatus;
  views: number;
  replies_count: number;
  likes_count: number;
  created_at: Date;
  updated_at: Date;
  last_activity: Date;
}

const ForumThreadSchema = new Schema<IForumThread>(
  {
    category_id: { type: Schema.Types.ObjectId, ref: "ForumCategory", required: true, index: true },
    author_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, index: "text" },
    content: { type: String, required: true },
    tags: { type: Schema.Types.Mixed }, // JSONB equivalent
    pinned: { type: Boolean, default: false },
    locked: { type: Boolean, default: false },
    status: { type: String, default: "active", enum: ["active", "pending", "hidden"], index: true },
    views: { type: Number, default: 0 },
    replies_count: { type: Number, default: 0 },
    likes_count: { type: Number, default: 0 },
    last_activity: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ForumThreadSchema.index({ title: "text", content: "text" });

export const ForumThread: Model<IForumThread> = mongoose.models.ForumThread || mongoose.model<IForumThread>("ForumThread", ForumThreadSchema);

// Keep Thread as alias for backward compatibility
export const Thread = ForumThread;

export type PostStatus = "active" | "hidden";

export interface IForumPost extends Document {
  thread_id: Types.ObjectId;
  author_id: Types.ObjectId;
  content: string;
  likes_count: number;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
}

const ForumPostSchema = new Schema<IForumPost>(
  {
    thread_id: { type: Schema.Types.ObjectId, ref: "ForumThread", required: true, index: true },
    author_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true },
    likes_count: { type: Number, default: 0 },
    status: { type: String, default: "active", enum: ["active", "hidden"], index: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ForumPostSchema.index({ thread_id: 1, created_at: 1 });

export const ForumPost: Model<IForumPost> =
  mongoose.models.ForumPost || mongoose.model<IForumPost>("ForumPost", ForumPostSchema);

// Keep ThreadReply as alias for backward compatibility
export const ThreadReply = ForumPost;

export type VoteType = "like" | "dislike";

export interface IPostVote extends Document {
  post_id: Types.ObjectId;
  user_id: Types.ObjectId;
  vote_type: VoteType;
  created_at: Date;
}

const PostVoteSchema = new Schema<IPostVote>(
  {
    post_id: { type: Schema.Types.ObjectId, ref: "ForumPost", required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vote_type: { type: String, required: true, enum: ["like", "dislike"] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: false } }
);

PostVoteSchema.index({ post_id: 1, user_id: 1 }, { unique: true });

export const PostVote: Model<IPostVote> =
  mongoose.models.PostVote || mongoose.model<IPostVote>("PostVote", PostVoteSchema);

// Keep old aliases for backward compatibility
export const ThreadCategory = ForumCategory;
export const ThreadPost = ForumPost;
export const ThreadLike = PostVote;
export const ThreadPostVote = PostVote;
