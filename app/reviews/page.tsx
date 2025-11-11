"use client";

import { useState, useEffect, useMemo } from "react";
import { Star, Search, TrendingUp, Award, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { InlineLoader } from "@/components/ui/page-loader";
import { PageTransition } from "@/components/ui/page-transition";
import { CardSkeleton } from "@/components/ui/skeleton-loader";
import Link from "next/link";

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

  const { topRated, loading: topRatedLoading, error: topRatedError } = useTopRatedData();

  const { statistics, loading: statisticsLoading, error: statisticsError } = useReviewStatistics();

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
      <div className="min-h-screen flex items-center justify-center">
        <InlineLoader text="Loading reviews..." variant="spinner" size="lg" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading reviews: {error}</div>;
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

  return (
    <div className="min-h-screen bg-background">
      <PageTransition>
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">
                Reviews & Ratings
              </h1>
              <p className="text-muted-foreground mt-1">
                Community feedback and trust scores
              </p>
            </div>
            <Link href="/reviews/write">
              <Button className="bg-primary hover:bg-primary/90">
                Write Review
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
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
                <SelectTrigger className="w-48">
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
                // Show skeleton loaders while loading
                Array.from({ length: 5 }).map((_, index) => (
                  <CardSkeleton key={index} />
                ))
              ) : filteredReviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No reviews found matching your criteria.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredReviews.map((review) => (
                  <Card
                    key={review._id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={
                              review.reviewer_id.avatar_url ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {review.reviewer_id.full_name
                              ? review.reviewer_id.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                              : "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">
                                  {review.reviewer_id.full_name}
                                </span>
                                {review.verified_purchase && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    <Shield className="h-3 w-3 mr-1" />
                                    Verified Purchase
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Review for{" "}
                                <span className="font-medium">
                                  {review.reviewee_id?.full_name ?? "Unknown"}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 mb-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(
                                  review.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {review.title && (
                            <h3 className="font-semibold mb-2">
                              {review.title}
                            </h3>
                          )}
                          {review.comment && (
                            <p className="text-muted-foreground leading-relaxed mb-3">
                              {review.comment}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {review.category && (
                                <Badge variant="outline">
                                  {review.category}
                                </Badge>
                              )}
                              <Button variant="ghost" size="sm">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust System Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Trust System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">How Trust Scores Work</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Based on verified reviews</li>
                    <li>• Updated in real-time</li>
                    <li>• Weighted by reviewer credibility</li>
                    <li>• Includes transaction history</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Trust Levels</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>New Member</span>
                      <span className="text-muted-foreground">0-3.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trusted</span>
                      <span className="text-muted-foreground">3.0-4.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Highly Trusted</span>
                      <span className="text-muted-foreground">4.0-4.5</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Elite</span>
                      <span className="text-muted-foreground">4.5-5.0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Rated Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Rated This Month
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topRatedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                        </div>
                        <div className="h-4 bg-muted rounded w-8 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : topRatedError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Unable to load top rated users
                    </p>
                  </div>
                ) : topRated.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      No top rated users this month
                    </p>
                  </div>
                ) : (
                  topRated.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.reviews} reviews
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{user.rating}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Review Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Review Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {statisticsLoading ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-8 animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                    </div>
                    <div className="space-y-2 mt-4">
                      <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-3 bg-muted rounded w-4 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-3 animate-pulse" />
                          <div className="h-2 bg-muted rounded flex-1 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-8 animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : statisticsError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Unable to load review statistics
                    </p>
                  </div>
                ) : statistics ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Total Reviews</span>
                      <span className="font-medium">{statistics.totalReviews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Average Rating</span>
                      <span className="font-medium">{statistics.averageRating}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Verified Reviews</span>
                      <span className="font-medium">{statistics.verifiedPercentage}%</span>
                    </div>

                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium text-sm">Rating Distribution</h4>
                      {statistics.ratingDistribution.map((dist) => (
                        <div
                          key={dist.stars}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-4">{dist.stars}</span>
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <Progress
                            value={dist.percentage}
                            className="flex-1 h-2"
                          />
                          <span className="text-muted-foreground w-8 text-right">
                            {dist.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
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
