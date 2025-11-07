"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, BookOpen, Clock, Award, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Course = {
  id: string;
  title: string;
  desc: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: "Agritech" | "Safety" | "Crops" | "Livestock";
  enrolled?: number;
  rating?: number;
};

const COURSES: Course[] = [
  {
    id: "intro-agritech",
    title: "Introduction to Modern Agritech",
    desc: "Learn the fundamentals of agricultural technology and digital farming practices for smallholder farmers.",
    duration: "2h",
    level: "Beginner",
    category: "Agritech",
    enrolled: 1250,
    rating: 4.8,
  },
  {
    id: "safe-pesticide",
    title: "Safe Pesticide Use & Application",
    desc: "Comprehensive guide to safe handling, application techniques, and health guidelines for pesticide use.",
    duration: "1.5h",
    level: "Beginner",
    category: "Safety",
    enrolled: 890,
    rating: 4.9,
  },
  {
    id: "advanced-crop-planning",
    title: "Advanced Crop Planning & Rotation",
    desc: "Master seasonal planning, crop rotation strategies, and yield optimization techniques.",
    duration: "3h",
    level: "Intermediate",
    category: "Crops",
    enrolled: 670,
    rating: 4.7,
  },
  {
    id: "soil-health",
    title: "Soil Health Management",
    desc: "Understanding soil composition, pH balance, and nutrient management for optimal yields.",
    duration: "2.5h",
    level: "Intermediate",
    category: "Crops",
    enrolled: 540,
    rating: 4.6,
  },
  {
    id: "livestock-care",
    title: "Livestock Care Fundamentals",
    desc: "Essential practices for livestock health, feeding, and disease prevention.",
    duration: "2h",
    level: "Beginner",
    category: "Livestock",
    enrolled: 420,
    rating: 4.5,
  },
  {
    id: "water-conservation",
    title: "Irrigation & Water Conservation",
    desc: "Efficient water use, irrigation systems, and conservation techniques for sustainable farming.",
    duration: "2h",
    level: "Intermediate",
    category: "Agritech",
    enrolled: 780,
    rating: 4.8,
  },
];

const LEVEL_COLORS = {
  Beginner: "bg-green-100 text-green-800 border-green-200",
  Intermediate: "bg-blue-100 text-blue-800 border-blue-200",
  Advanced: "bg-purple-100 text-purple-800 border-purple-200",
};

export default function Catalog() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"" | Course["category"]>("");
  const [level, setLevel] = useState<"" | Course["level"]>("");

  const items = useMemo(
    () =>
      COURSES.filter(
        (c) =>
          (!q ||
            (c.title + " " + c.desc).toLowerCase().includes(q.toLowerCase())) &&
          (!cat || c.category === cat) &&
          (!level || c.level === level)
      ),
    [q, cat, level]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Course Catalog
        </h2>
        <span className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "course" : "courses"}
        </span>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses..."
            className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-primary"
            aria-label="Search courses"
          />
        </div>
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          <option value="Agritech">Agritech</option>
          <option value="Safety">Safety</option>
          <option value="Crops">Crops</option>
          <option value="Livestock">Livestock</option>
        </select>
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          aria-label="Filter by level"
        >
          <option value="">All Levels</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((c) => (
          <Card
            key={c.id}
            className="hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className={LEVEL_COLORS[c.level]}>
                  {c.level}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {c.category}
                </Badge>
              </div>

              <div>
                <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {c.desc}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{c.duration}</span>
                </div>
                {c.rating && (
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{c.rating}/5</span>
                  </div>
                )}
                {c.enrolled && (
                  <div className="flex items-center gap-1">
                    <span>{c.enrolled} enrolled</span>
                  </div>
                )}
              </div>

              <Link href={`/learning/course/${c.id}`} className="block">
                <Button className="w-full" size="sm">
                  View Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">
              No courses match your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
