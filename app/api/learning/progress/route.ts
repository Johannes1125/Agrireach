import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { connectToDatabase } from "@/server/lib/mongodb";
import { LearningProgress } from "@/server/models/LearningProgress";

export async function GET(_req: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const docs = await LearningProgress.find({ user: user.id }).lean();
  const normalized = docs.map((d: any) => {
    const lessonProgress = d.lessonProgress || {};
    const completedLessons = Object.values(lessonProgress).filter(
      (p: any) => p?.completed
    ).length;
    const totalLessons = d.totalLessons || 0;
    const progressPercent =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    return {
      courseId: d.courseId,
      courseTitle: d.courseTitle,
      totalLessons,
      completedLessons,
      progressPercent,
      hasCertificate: !!d.hasCertificate,
      totalTimeSeconds: d.totalTimeSeconds || 0,
      lastLessonId: d.lastLessonId || null,
      updated_at: d.updated_at,
    };
  });
  return NextResponse.json(normalized);
}
