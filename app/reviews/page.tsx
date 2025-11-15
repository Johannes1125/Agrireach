"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, Search, TrendingUp, Award, Shield, Plus, Clock, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useReviewsData } from "@/hooks/use-reviews-data";
import { useTopRatedData } from "@/hooks/use-top-rated-data";
import { useReviewStatistics } from "@/hooks/use-review-statistics";
import { ContentLoader } from "@/components/ui/content-loader";
import { PageTransition } from "@/components/ui/page-transition";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

const categories = [
  "All",
  "Product Quality",
  "Work Quality",
  "Communication",
  "Delivery",
  "Value for Money",
];
const sortOptions = [
  "Most Recent",
  "Highest Rated",
  "Most Helpful",
  "Lowest Rated",
];

function normalizeUser(u: any) {
  if (!u) return { full_name: "Unknown", avatar_url: "", _id: undefined };
  if (typeof u === "string")
    return { _id: u, full_name: "Unknown", avatar_url: "" };
  return {
    _id: u._id ?? u.id,
    full_name: u.full_name ?? u.name ?? "Unknown",
    avatar_url: u.avatar_url ?? u.avatar ?? "",
  };
}

function normalizeReview(r: any) {
  if (!r || typeof r !== "object") return r;
  return {
    ...r,
    reviewer_id: normalizeUser(r.reviewer_id),
    reviewee_id: normalizeUser(r.reviewee_id),
  };
}

export default function ReviewsPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Most Recent");

  const {
    reviews,
    loading: reviewsLoading,
    error,
    addOptimistic,
    refetch,
  } = useReviewsData({
    status: "active",
    limit: 20,
  });

  const {
    topRated,
    loading: topRatedLoading,
    error: topRatedError,
  } = useTopRatedData();

  const {
    statistics,
    loading: statisticsLoading,
    error: statisticsError,
  } = useReviewStatistics();

  // Normalize reviews from the hook to a safe shape
  const normalizedReviews = useMemo(
    () => (Array.isArray(reviews) ? reviews.map(normalizeReview) : []),
    [reviews]
  );

  // Pick up optimistic review from Write page (same-tab navigation)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("reviews:optimistic");
      if (raw) {
        const r = JSON.parse(raw);
        if (r) addOptimistic(normalizeReview(r));
        sessionStorage.removeItem("reviews:optimistic");
      }
    } catch {}
  }, [addOptimistic]);

  // Also listen for "reviews:updated" while staying on this page
  useEffect(() => {
    const onUpdated = () => refetch();
    window.addEventListener("reviews:updated", onUpdated as any);
    return () =>
      window.removeEventListener("reviews:updated", onUpdated as any);
  }, [refetch]);

  if (authLoading || reviewsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ContentLoader text="Loading reviews..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="border-2 border-destructive/20">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium">Error loading reviews: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const searchLower = (searchTerm || "").toLowerCase();
  const filteredReviews = normalizedReviews.filter((review: any) => {
    const matchesCategory =
      selectedCategory === "All" || review.category === selectedCategory;
    const haystacks = [
      review.title,
      review.comment,
      review.reviewee_id?.full_name,
      review.reviewer_id?.full_name,
    ]
      .filter(Boolean)
      .map((s: string) => s.toLowerCase());

    const matchesSearch =
      !searchLower || haystacks.some((h: string) => h.includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  // Sort reviews
  const sortedReviews = useMemo(() => {
    const sorted = [...filteredReviews];
    switch (sortBy) {
      case "Highest Rated":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "Lowest Rated":
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case "Most Helpful":
        return sorted.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0));
      case "Most Recent":
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
    }
  }, [filteredReviews, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
        {/* Enhanced Header */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
          <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-foreground">
                  Reviews & Ratings
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Community feedback and trust scores
                </p>
              </div>
              <Link href="/reviews/write">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Write Review
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Enhanced Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base bg-card border-2 focus:border-primary/50 transition-colors"
                  />
                </div>

                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-48 h-12 text-sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 h-12 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {reviewsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <CardSkeleton key={index} />
                  ))
                ) : sortedReviews.length === 0 ? (
                  <Card className="border-2">
                    <CardContent className="py-16 sm:py-20 text-center px-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                        <Star className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No reviews found</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm">
                        {searchTerm || selectedCategory !== "All"
                          ? "Try adjusting your search or filters to find reviews."
                          : "Be the first to share your experience! Write a review to help others."}
                      </p>
                      {!searchTerm && selectedCategory === "All" && (
                        <Link href="/reviews/write">
                          <Button size="lg" className="bg-primary hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" />
                            Write First Review
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  sortedReviews.map((review) => (
                    <Card
                      key={review._id}
                      className="group border-2 hover:shadow-lg hover:border-primary/50 transition-all duration-300"
                    >
                      <CardContent className="p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-border group-hover:border-primary/50 transition-colors flex-shrink-0">
                            <AvatarImage
                              src={
                                review.reviewer_id.avatar_url ||
                                "/placeholder.svg"
                              }
                            />
                            <AvatarFallback className="text-sm font-medium">
                              {review.reviewer_id.full_name
                                ? review.reviewer_id.full_name
                                    .split(" ")
                                    .map((part: string) => part[0])
                                    .join("")
                                    .toUpperCase()
                                : "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  <h3 className="font-heading font-semibold text-base sm:text-lg">
                                    {review.reviewer_id.full_name}
                                  </h3>
                                  {review.verified_purchase && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Review for{" "}
                                  <span className="font-medium text-foreground">
                                    {review.reviewee_id?.full_name ?? "Unknown"}
                                  </span>
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={cn(
                                        "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                                        i < (review.rating || 0)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-muted-foreground/30"
                                      )}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {review.created_at ? formatRelativeTime(review.created_at) : "Recently"}
                                </span>
                              </div>
                            </div>

                            {review.title && (
                              <h4 className="font-heading font-semibold text-base group-hover:text-primary transition-colors">
                                {review.title}
                              </h4>
                            )}
                            {review.comment && (
                              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                {review.comment}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center gap-3 flex-wrap">
                                {review.category && (
                                  <Badge variant="outline" className="text-xs font-medium">
                                    {review.category}
                                  </Badge>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 text-xs sm:text-sm text-muted-foreground hover:text-foreground"
                                >
                                  <ThumbsUp className="h-3.5 w-3.5 mr-1.5" />
                                  Helpful ({review.helpful_count || 0})
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Trust System Overview */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <span>Trust System</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">How Trust Scores Work</h4>
                    <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Based on verified reviews</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Updated in real-time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Weighted by reviewer credibility</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Includes transaction history</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 text-sm sm:text-base">Trust Levels</h4>
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <span className="font-medium">New Member</span>
                        <span className="text-muted-foreground">0-3.0</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <span className="font-medium">Trusted</span>
                        <span className="text-muted-foreground">3.0-4.0</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <span className="font-medium">Highly Trusted</span>
                        <span className="text-muted-foreground">4.0-4.5</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <span className="font-medium text-primary">Elite</span>
                        <span className="text-primary font-semibold">4.5-5.0</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Rated Users */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <TrendingUp className="h-5 w-5 text-red-500" />
                    </div>
                    <span>Top Rated This Month</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topRatedLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 animate-pulse"
                        >
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-muted rounded w-24" />
                            <div className="h-3 bg-muted rounded w-16" />
                          </div>
                          <div className="h-4 bg-muted rounded w-8" />
                        </div>
                      ))}
                    </div>
                  ) : topRatedError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Unable to load top rated users
                      </p>
                    </div>
                  ) : topRated.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">No top rated users this month</p>
                    </div>
                  ) : (
                    topRated.slice(0, 3).map((user, index) => (
                      <div
                        key={user.id}
                        className="group flex items-center justify-between p-3 rounded-lg border-2 hover:border-primary/50 hover:bg-muted/50 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0">
                            {index + 1}
                          </div>
                          <Avatar className="h-10 w-10 border-2 border-border group-hover:border-primary/50 transition-colors flex-shrink-0">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.reviews} reviews
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold">{user.rating}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Review Stats */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Award className="h-5 w-5 text-yellow-500" />
                    </div>
                    <span>Review Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {statisticsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex justify-between">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : statisticsError ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">
                        Unable to load review statistics
                      </p>
                    </div>
                  ) : statistics ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <span className="text-sm font-medium">Total Reviews</span>
                          <span className="text-lg font-bold text-primary">
                            {statistics.totalReviews.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">Average Rating</span>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-lg font-bold">{statistics.averageRating}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-medium">Verified Reviews</span>
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {statistics.verifiedPercentage}%
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <h4 className="font-semibold text-sm sm:text-base mb-3">
                          Rating Distribution
                        </h4>
                        {statistics.ratingDistribution.map((dist) => (
                          <div
                            key={dist.stars}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="w-6 font-medium">{dist.stars}</span>
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            <Progress
                              value={dist.percentage}
                              className="flex-1 h-2.5"
                            />
                            <span className="text-muted-foreground w-10 text-right text-xs font-medium">
                              {dist.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Award className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No review statistics available
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
