import { useState, useEffect } from "react";
import { authFetch } from "@/lib/auth-client";

export interface BuyerStats {
  totalOrders: number;
  totalSpent: number;
  activeOrders: number;
  averageRating: number;
}

export interface RecentOrder {
  id: string;
  productName: string;
  supplier: string;
  quantity: string;
  date: string;
  status: string;
  amount: number;
}

export interface BuyerStatsResponse {
  stats: BuyerStats;
  recentOrders: RecentOrder[];
  generated_at: string;
}

export function useBuyerStats() {
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuyerStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await authFetch("/api/profile/buyer-stats");
        
        if (!res.ok) {
          throw new Error("Failed to fetch buyer statistics");
        }
        
        const data: BuyerStatsResponse = await res.json();
        setStats(data.stats || null);
        setRecentOrders(data.recentOrders || []);
      } catch (err: any) {
        console.error("Error fetching buyer stats:", err);
        setError(err.message || "Failed to fetch buyer statistics");
        // Fallback to default values
        setStats({
          totalOrders: 0,
          totalSpent: 0,
          activeOrders: 0,
          averageRating: 0,
        });
        setRecentOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyerStats();
  }, []);

  return { stats, recentOrders, loading, error };
}
