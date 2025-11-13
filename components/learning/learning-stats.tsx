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
      color: "text-blue-600",
    },
    {
      icon: Award,
      label: "Certificates Earned",
      value: String(stats.certificatesEarned),
      color: "text-yellow-600",
    },
    {
      icon: Clock,
      label: "Hours Learned",
      value: String(stats.hoursLearned),
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((stat) => (
        <Card key={stat.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "--" : stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
