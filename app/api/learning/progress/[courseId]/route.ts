import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { LearningProgress } from "@/server/models/LearningProgress";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const doc = await LearningProgress.findOne({
    user: user.id,
    courseId: courseId,
  }).lean();
  return NextResponse.json(doc || null);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const body = await req.json();
  const {
    courseTitle,
    hasCertificate,
    totalLessons,
    lessonProgress,
    lastLessonId,
    totalTimeSeconds,
  } = body || {};

  if (!totalLessons || typeof totalLessons !== "number") {
    return NextResponse.json(
      { error: "totalLessons is required" },
      { status: 400 }
    );
  }

  const update: any = {
    courseTitle,
    hasCertificate: !!hasCertificate,
    totalLessons,
    lastLessonId,
    lastActiveAt: new Date(),
  };
  if (lessonProgress) update.lessonProgress = lessonProgress;
  if (typeof totalTimeSeconds === "number")
    update.totalTimeSeconds = totalTimeSeconds;

  const doc = await LearningProgress.findOneAndUpdate(
    { user: user.id, courseId: courseId },
    { $set: update },
    { new: true, upsert: true }
  ).lean();

  return NextResponse.json(doc);
}
