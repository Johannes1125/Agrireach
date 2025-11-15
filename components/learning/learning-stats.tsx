"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Award, Clock, TrendingUp } from "lucide-react";

export default function LearningStats({ user }: { user: any }) {
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    certificatesEarned: 0,
    hoursLearned: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/learning/stats", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStats(data);
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

  const items = [
    {
      icon: BookOpen,
      label: "Courses Enrolled",
      value: String(stats.coursesEnrolled),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    },
    {
      icon: Award,
      label: "Certificates Earned",
      value: String(stats.certificatesEarned),
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10 dark:bg-yellow-500/20",
    },
    {
      icon: Clock,
      label: "Hours Learned",
      value: String(stats.hoursLearned),
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10 dark:bg-green-500/20",
    },
    {
      icon: TrendingUp,
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => (
        <Card key={stat.label} className="border-2 hover:shadow-lg hover:border-primary/50 transition-all duration-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg ${stat.bgColor} ${stat.color} flex-shrink-0`}>
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {loading ? "--" : stat.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
