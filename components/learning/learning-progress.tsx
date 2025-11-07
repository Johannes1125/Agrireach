"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target } from "lucide-react";
import Link from "next/link";

export default function LearningProgress({ userId }: { userId: string }) {
  const inProgress = [
    { id: "intro-agritech", title: "Intro to Agritech", progress: 75 },
    { id: "safe-pesticide", title: "Safe Pesticide Use", progress: 40 },
    { id: "advanced-crop-planning", title: "Crop Planning 101", progress: 15 }, // ✅ FIXED!
  ];

  return (
    <>
      {/* In Progress */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" />
            In Progress
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inProgress.map((course) => (
            <div key={course.id} className="space-y-2">
              <Link
                href={`/learning/course/${course.id}`}
                className="text-sm font-medium hover:text-primary line-clamp-2"
              >
                {course.title}
              </Link>
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {course.progress}% complete
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Recent Achievements
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <p className="text-sm font-medium">First Course Completed</p>
              <p className="text-xs text-muted-foreground">3 days ago</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <p className="text-sm font-medium">10 Hours Milestone</p>
              <p className="text-xs text-muted-foreground">1 week ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
