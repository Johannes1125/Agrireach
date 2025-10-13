import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-client";

export interface RatingDistribution {
  stars: number;
  count: number;
  percentage: number;
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  verifiedPercentage: number;
  ratingDistribution: RatingDistribution[];
  generated_at: string;
}

export function useReviewStatistics() {
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await authFetch("/api/reviews/statistics");
        
        if (!res.ok) {
          throw new Error("Failed to fetch review statistics");
        }
        
        const data = await res.json();
        setStatistics(data.stats || null);
      } catch (err: any) {
        console.error("Error fetching review statistics:", err);
        setError(err.message || "Failed to fetch review statistics");
        // Fallback to default values
        setStatistics({
          totalReviews: 0,
          averageRating: 0,
          verifiedPercentage: 0,
          ratingDistribution: [],
          generated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  return { statistics, loading, error };
}
