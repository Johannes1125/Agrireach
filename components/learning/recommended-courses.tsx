"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Trans from "@/components/ui/trans";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RecommendedCourses({ userId }: { userId: string }) {
  const recommended = [
    {
      id: "soil-health",
      title: "Soil Health Management",
      reason: "Based on your interest in Crops",
    },
    {
      id: "water-management",
      title: "Irrigation & Water Conservation",
      reason: "Popular in your region",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-yellow-600" />
        <Trans text="Recommended for You" />
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommended.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-1">{course.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">
                {course.reason}
              </p>
              <Link href={`/learning/course/${course.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  <Trans text="Learn More" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
