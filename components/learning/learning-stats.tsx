"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Award, Clock, TrendingUp } from "lucide-react";

export default function LearningStats({ user }: { user: any }) {
  const stats = [
    {
      icon: BookOpen,
      label: "Courses Enrolled",
      value: "3",
      color: "text-blue-600",
    },
    {
      icon: Award,
      label: "Certificates Earned",
      value: "1",
      color: "text-yellow-600",
    },
    {
      icon: Clock,
      label: "Hours Learned",
      value: "12.5",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      label: "Completion Rate",
      value: "67%",
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
