"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  Search,
  Plus,
  Sprout,
  TrendingDown,
  Wrench,
  CloudSun,
  Trophy,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommunityData } from "@/hooks/use-community-data";
import { PageTransition } from "@/components/ui/page-transition";
import { ContentLoader } from "@/components/ui/content-loader";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  posts_count?: number;
}

const forumCategories: CategoryItem[] = [];

// Icon mapping function with Lucide icons
function getCategoryIconComponent(name?: string) {
  const key = (name || "").toLowerCase();
  if (key.includes("farming") || key.includes("tips")) {
    return { Icon: Sprout, color: "text-green-500", bgColor: "bg-green-500/10" };
  }
  if (key.includes("market")) {
    return { Icon: BarChart3, color: "text-red-500", bgColor: "bg-red-500/10" };
  }
  if (key.includes("equipment") || key.includes("tools")) {
    return { Icon: Wrench, color: "text-blue-500", bgColor: "bg-blue-500/10" };
  }
  if (key.includes("weather") || key.includes("season")) {
    return { Icon: CloudSun, color: "text-yellow-500", bgColor: "bg-yellow-500/10" };
  }
  if (key.includes("success")) {
    return { Icon: Trophy, color: "text-purple-500", bgColor: "bg-purple-500/10" };
  }
  return { Icon: MessageSquare, color: "text-primary", bgColor: "bg-primary/10" };
}

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { stats, trendingTopics, recentActivity, loading, error } =
    useCommunityData();

  useEffect(() => {
    const load = async () => {
      setCategoriesLoading(true);
      const [data] = await Promise.all([
        fetch("/api/community/categories").then(res => res.json().catch(() => ({}))),
        new Promise(resolve => setTimeout(resolve, 500))
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
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Community Forums
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Connect, share knowledge, and grow together
                </p>
              </div>
              <Link href="/community/new-thread">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Discussion
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6 sm:space-y-8">
              {/* Enhanced Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search forums, topics, and discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base bg-card border-2 focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Forum Categories */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
                    Forum Categories
                  </h2>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
                  </Badge>
                </div>
                
                {categoriesLoading ? (
                  <ContentLoader text="Loading categories..." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {filteredCategories.map((category: any, idx: number) => {
                      const href = `/community/category/${
                        category._id || encodeURIComponent(category.name)
                      }`;
                      const { Icon, color, bgColor } = getCategoryIconComponent(category.name);
                      const key = String(
                        category._id || category.id || category.name || idx
                      );
                      const postsCount = category.posts_count ?? 0;
                      
                      return (
                        <Link key={key} href={href}>
                          <Card className="group hover:shadow-lg hover:border-primary/50 transition-all duration-300 cursor-pointer h-full">
                            <CardContent className="p-5 sm:p-6">
                              <div className="flex items-start gap-4">
                                <div className={cn(
                                  "p-3 rounded-xl transition-transform group-hover:scale-110",
                                  bgColor
                                )}>
                                  <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7", color)} />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                  <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {category.name}
                                  </h3>
                                  {category.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                      {category.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 pt-2">
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                                      <MessageSquare className="h-4 w-4" />
                                      <span className="font-medium">{postsCount}</span>
                                      <span>{postsCount === 1 ? 'post' : 'posts'}</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                )}
                
                {filteredCategories.length === 0 && !categoriesLoading && (
                  <Card>
                    <CardContent className="py-12 sm:py-16 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground text-sm sm:text-base">
                        No categories found. Try adjusting your search.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Community Stats */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <span>Community Stats</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Total Members</span>
                    <span className="text-lg font-bold text-primary">
                      {stats?.totalMembers?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Total Threads</span>
                    <span className="text-lg font-bold text-foreground">
                      {stats?.totalThreads?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Total Posts</span>
                    <span className="text-lg font-bold text-foreground">
                      {stats?.totalPosts?.toLocaleString() || "0"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <span className="text-sm font-medium">Online Now</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                      {stats?.onlineNow || "0"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Trending Topics */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                    </div>
                    <span>Trending Topics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trendingTopics.length > 0 ? (
                    trendingTopics.map((topic, index) => (
                      <Link
                        key={topic._id || index}
                        href={`/community/thread/${topic._id}`}
                        className="block p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <p className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2 mb-2 transition-colors">
                          {topic.title}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {topic.category || "General"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {topic.replies_count || 0} {topic.replies_count === 1 ? 'reply' : 'replies'}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <TrendingDown className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No trending topics yet.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    </div>
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <Link
                        key={index}
                        href={
                          activity.thread_id
                            ? `/community/thread/${activity.thread_id}`
                            : "#"
                        }
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <Avatar className="h-9 w-9 border-2 border-border group-hover:border-primary/50 transition-colors">
                          <AvatarImage
                            src={activity.user.avatar_url || "/placeholder.svg"}
                          />
                          <AvatarFallback className="text-xs">
                            {activity.user.full_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed">
                            <span className="font-semibold text-foreground">
                              {activity.user.full_name || "Anonymous"}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}{activity.action}{" "}
                            </span>
                            <span className="text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {activity.topic}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.time}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No recent activity.
                      </p>
                    </div>
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
