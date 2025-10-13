import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-client";

export interface TopRatedUser {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviews: number;
  location: string;
  rank: number;
}

export interface TopRatedResponse {
  topRated: TopRatedUser[];
  period: string;
  generated_at: string;
}

export function useTopRatedData() {
  const [topRated, setTopRated] = useState<TopRatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopRated = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await authFetch("/api/reviews/top-rated");
        
        if (!res.ok) {
          throw new Error("Failed to fetch top rated users");
        }
        
        const data: TopRatedResponse = await res.json();
        setTopRated(data.topRated || []);
      } catch (err: any) {
        console.error("Error fetching top rated users:", err);
        setError(err.message || "Failed to fetch top rated users");
        // Fallback to empty array
        setTopRated([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRated();
  }, []);

  return { topRated, loading, error };
}
