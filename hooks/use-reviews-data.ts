"use client";

import { useState, useEffect, useCallback } from "react";
import { authFetch } from "@/lib/auth-client";

export interface Review {
  _id: string;
  reviewer_id: {
    full_name: string;
    avatar_url?: string;
  };
  reviewee_id: {
    full_name: string;
    avatar_url?: string;
  };
  rating: number;
  title?: string;
  comment?: string;
  category?: string;
  verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  status: string;
}

export interface ReviewsFilters {
  reviewee_id?: string;
  reviewer_id?: string;
  category?: string;
  rating?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export function useReviewsData(filters: ReviewsFilters = {}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filters.reviewee_id)
        params.append("reviewee_id", filters.reviewee_id);
      if (filters.reviewer_id)
        params.append("reviewer_id", filters.reviewer_id);
      if (filters.category) params.append("category", filters.category);
      if (filters.rating) params.append("rating", filters.rating.toString());
      if (filters.status) params.append("status", filters.status);
      params.append("page", (filters.page || 1).toString());
      params.append("limit", (filters.limit || 20).toString());

      const res = await authFetch(`/api/reviews?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");

      const data = await res.json();

      const payload = data?.data || data || {};
      setReviews(Array.isArray(payload.reviews) ? payload.reviews : []);
      setTotal(Number(payload.total || 0));
      setPages(Number(payload.pages || 0));
    } catch (err: any) {
      setError(err.message);
      console.error("Reviews fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    filters.reviewee_id,
    filters.reviewer_id,
    filters.category,
    filters.rating,
    filters.status,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const handler = () => fetchReviews();
    window.addEventListener("reviews:updated", handler as any);
    return () => window.removeEventListener("reviews:updated", handler as any);
  }, [fetchReviews]);

  const addOptimistic = useCallback((r: Review) => {
    setReviews((prev) => [r, ...prev]);
  }, []);

  return {
    reviews,
    loading,
    error,
    total,
    pages,
    refetch: fetchReviews,
    addOptimistic,
  };
}
