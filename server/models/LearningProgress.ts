import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface ILessonProgress {
  completed: boolean;
  // Optional per-lesson metadata
  quizPassed?: boolean;
  videoWatched?: boolean;
}

export interface ILearningProgress extends Document {
  user: Types.ObjectId;
  courseId: string;
  courseTitle?: string;
  hasCertificate?: boolean;
  totalLessons: number;
  lessonProgress: Record<string, ILessonProgress>;
  lastLessonId?: number;
  lastActiveAt?: Date;
  totalTimeSeconds?: number; // aggregated estimate from completed lessons
  created_at: Date;
  updated_at: Date;
}

const LessonProgressSchema = new Schema<ILessonProgress>({
  completed: { type: Boolean, default: false },
  quizPassed: { type: Boolean },
  videoWatched: { type: Boolean },
});

const LearningProgressSchema = new Schema<ILearningProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },
    courseId: { type: String, index: true, required: true },
    courseTitle: { type: String },
    hasCertificate: { type: Boolean, default: false },
    totalLessons: { type: Number, required: true },
    lessonProgress: { type: Map, of: LessonProgressSchema, default: {} },
    lastLessonId: { type: Number },
    lastActiveAt: { type: Date },
    totalTimeSeconds: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

LearningProgressSchema.index({ user: 1, courseId: 1 }, { unique: true });

export const LearningProgress: Model<ILearningProgress> =
  mongoose.models.LearningProgress ||
  mongoose.model<ILearningProgress>("LearningProgress", LearningProgressSchema);
