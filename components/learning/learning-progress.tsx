"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target } from "lucide-react";
import Link from "next/link";

type ProgressItem = { id: string; title?: string; progress: number };

export default function LearningProgress({ userId }: { userId: string }) {
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/learning/progress", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const mapped: ProgressItem[] = data.map((d: any) => ({
              id: d.courseId,
              title: d.courseTitle,
              progress: d.progressPercent ?? 0,
            }));
            setItems(mapped);
          }
        }
      } catch (e) {
        console.warn(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
          {items.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              No active courses yet.
            </p>
          )}
          {(loading
            ? [{ id: "--", title: "Loading...", progress: 0 }]
            : items
          ).map((course) => (
            <div key={course.id} className="space-y-2">
              <Link
                href={`/learning/course/${course.id}`}
                className="text-sm font-medium hover:text-primary line-clamp-2"
              >
                {course.title || course.id}
              </Link>
              <Progress value={course.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {course.progress}% complete
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Achievements (static for now) */}
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
              <p className="text-xs text-muted-foreground">Recently</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <p className="text-sm font-medium">Learning Streak</p>
              <p className="text-xs text-muted-foreground">Keep it up!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
