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
  const totalCourses = docs.length;
  let totalLessons = 0;
  let completedLessons = 0;
  let certificates = 0;
  let totalTimeSeconds = 0;
  for (const d of docs as any[]) {
    const lessons = d.totalLessons || 0;
    totalLessons += lessons;
    const lp = d.lessonProgress || {};
    completedLessons += Object.values(lp).filter(
      (p: any) => p?.completed
    ).length;
    if (d.hasCertificate) certificates += 1;
    totalTimeSeconds += d.totalTimeSeconds || 0;
  }
  const completionRate =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const hoursLearned = +(totalTimeSeconds / 3600).toFixed(1);

  return NextResponse.json({
    coursesEnrolled: totalCourses,
    certificatesEarned: certificates,
    hoursLearned,
    completionRate,
  });
}
