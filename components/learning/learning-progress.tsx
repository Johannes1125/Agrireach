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
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <span>In Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 && !loading && (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No active courses yet.
              </p>
            </div>
          )}
          {(loading
            ? [{ id: "--", title: "Loading...", progress: 0 }]
            : items
          ).map((course) => (
            <div key={course.id} className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 dark:hover:bg-card/50 transition-colors">
              <Link
                href={`/learning/course/${course.id}`}
                className="text-sm font-medium hover:text-primary line-clamp-2 block"
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

      {/* Achievements */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Complete courses to earn achievements
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
