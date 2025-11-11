"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityData } from "@/hooks/use-community-data";
import { PageTransition } from "@/components/ui/page-transition";
import { InlineLoader } from "@/components/ui/page-loader";
import Link from "next/link";

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  posts_count?: number;
}
const forumCategories: CategoryItem[] = [];

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { stats, trendingTopics, recentActivity, loading, error } =
    useCommunityData();

  function getCategoryIcon(name?: string) {
    const key = (name || "").toLowerCase();
    if (key.includes("farming") || key.includes("tips")) return "🌱";
    if (key.includes("market")) return "📈";
    if (key.includes("equipment") || key.includes("tools")) return "🚜";
    if (key.includes("weather") || key.includes("season")) return "🌤️";
    if (key.includes("success")) return "🏆";
    if (key.includes("general")) return "💬";
    return "💬";
  }

  useEffect(() => {
    const load = async () => {
      setCategoriesLoading(true);
      // Add minimum delay for loading state
      const [data] = await Promise.all([
        fetch("/api/community/categories").then(res => res.json().catch(() => ({}))),
        new Promise(resolve => setTimeout(resolve, 2000)) // Minimum 2 second delay
      ]);
      if (data?.data?.items) setCategories(data.data.items);
      setCategoriesLoading(false);
    };
    load();
  }, []);

  const filteredCategories = (categories || []).filter((category) => {
    const name = (category.name || "").toLowerCase();
    const desc = (category.description || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || desc.includes(term);
  });

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-sans">
                Community Forums
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Connect, share knowledge, and grow together
              </p>
            </div>
            <Link href="/community/new-thread">
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search forums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Forum Categories */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Forum Categories</h2>
              {categoriesLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <InlineLoader text="Loading categories..." variant="spinner" size="lg" />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCategories.map((category: any, idx: number) => {
                    const href = `/community/category/${
                      category._id || encodeURIComponent(category.name)
                    }`;
                    const icon = category.icon || getCategoryIcon(category.name);
                    const key = String(
                      category._id || category.id || category.name || idx
                    );
                    return (
                      <Card
                        key={key}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="text-3xl">{icon}</div>
                            <div className="flex-1 min-w-0">
                              <Link href={href}>
                                <h3 className="text-lg font-semibold hover:text-primary cursor-pointer">
                                  {category.name}
                                </h3>
                              </Link>
                              <p className="text-muted-foreground text-sm mt-1">
                                {String(
                                  category && category.description
                                    ? category.description
                                    : ""
                                )}
                              </p>

                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span>{category.posts_count ?? 0} posts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {filteredCategories.length === 0 && !categoriesLoading && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No categories found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total Members</span>
                  <span className="font-semibold">
                    {stats?.totalMembers?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Threads</span>
                  <span className="font-semibold">
                    {stats?.totalThreads?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Posts</span>
                  <span className="font-semibold">
                    {stats?.totalPosts?.toLocaleString() || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Online Now</span>
                  <span className="font-semibold text-green-600">
                    {stats?.onlineNow || "0"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={topic._id || index} className="space-y-1">
                    <Link
                      href={`/community/thread/${topic._id}`}
                      className="text-sm font-medium hover:text-primary line-clamp-2"
                    >
                      {topic.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {topic.category || "General"}
                      </Badge>
                      <span>{topic.replies_count || 0} replies</span>
                    </div>
                  </div>
                ))}
                {trendingTopics.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">
                    No trending topics yet.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={activity.user.avatar_url || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {activity.user.full_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.user.full_name}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          {activity.action}{" "}
                        </span>
                        <Link
                          href={
                            activity.thread_id
                              ? `/community/thread/${activity.thread_id}`
                              : "#"
                          }
                          className="hover:text-primary line-clamp-1"
                        >
                          {activity.topic}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground">
                    No recent activity.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </PageTransition>
    </div>
  );
}
